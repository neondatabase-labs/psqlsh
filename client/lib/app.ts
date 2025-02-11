import { Pool, DatabaseError } from "@neondatabase/serverless";
import * as Sentry from "@sentry/browser";

import { TermWrapper } from "./termWrapper";
import { client } from "./api";
import { performDbQuery } from "./dbQuery";
import { Color } from "./color";
import { analytics } from "./analytics";
import { InputManager } from "./inputManager";
import { Select } from "./select";

function isConnectionError(err: unknown) {
  if (err instanceof Error && "code" in err) {
    return err.code === "XX000";
  }

  return false;
}

export enum AppMode {
  Normal = "normal",
  Templates = "templates",
  Embed = "embed",
}

export class App {
  termWrapper: TermWrapper;
  inputManager: InputManager;
  sourceBranch?: string;

  constructor(
    private appMode: AppMode,
    private appNode: HTMLElement,
  ) {
    const inputNode = document.createElement("textarea");
    inputNode.classList.add("terminal-input-hidden");
    inputNode.setAttribute("tabindex", "-1");
    appNode.addEventListener("click", () => {
      const selection = document.getSelection();
      if (
        selection &&
        selection.rangeCount > 0 &&
        !selection?.getRangeAt(0)?.collapsed
      ) {
        return;
      }
      setTimeout(() => {
        inputNode.focus();
      }, 1);
    });
    document.body.addEventListener("keydown", (event) => {
      const selection = document.getSelection();
      if (
        selection &&
        selection.rangeCount > 0 &&
        !selection?.getRangeAt(0)?.collapsed &&
        !(event.ctrlKey || event.metaKey)
      ) {
        inputNode.focus();
      }
      return;
    });
    appNode.appendChild(inputNode);
    this.inputManager = new InputManager(inputNode);
    this.termWrapper = new TermWrapper(appNode, this.inputManager);
    document.getElementById("info")!.addEventListener("click", () => {
      this.showBanner();
    });
    document
      .getElementById("back")!
      .addEventListener("click", () => this.hideBanner());
    document.addEventListener("keydown", (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        this.hideBanner();
      }
    });
  }

  async startConnection() {
    const { termWrapper } = this;
    termWrapper.hideCursor();
    termWrapper.addLine();
    termWrapper.writeln(`Starting the database connection...`);
    termWrapper.addLine();
    let connectionString: string;
    try {
      const response = await client.issueDatabase.mutate({
        sourceBranch: this.sourceBranch,
      });
      connectionString = response.connectionString;
    } catch (error) {
      const message = (error as Error).message;
      termWrapper.writeln(`ERROR: ${message}`);
      analytics.track("database_issue_error", { message });
      console.log("Error:", error);
      return;
    }
    const pgPool = new Pool({
      connectionString,
    });
    pgPool.on("error", (err) => {
      console.log("Unexpected error on idle client", err);
    });
    analytics.track("database_issued");
    try {
      const pgClient = await pgPool.connect();
      pgClient.on("error", (err) => {
        console.log("Unexpected error on client", err);
      });
      const { rows } = await pgClient.query("show server_version");
      if (rows.length === 0) {
        termWrapper.writeln("Something went wrong. Please try again.");
      }
      termWrapper.write(`psql (Neon, server `);
      termWrapper.write(rows[0].server_version, Color.Green);
      termWrapper.writeln(`)`);
      pgClient.release();
    } catch (error) {
      const message = (error as Error).message;
      termWrapper.writeln(`ERROR: ${message}`);
      analytics.track("database_connection_error", { message });
      console.log("Error:", error);
      return;
    }
    analytics.track("database_connected");
    termWrapper.writeln('Type "\\?" for help.');
    termWrapper.writeln(
      'You can also type "\\ai &lt;your query description&gt;" to generate SQL with AI.',
    );
    termWrapper.addLine();
    let isTransaction = false;
    const performQuery = async (query: string) => {
      termWrapper.hideCursor();
      let limit = 1000;
      for await (const output of performDbQuery(
        pgPool,
        query,
        (isTransactionIn) => {
          isTransaction = isTransactionIn;
        },
      )) {
        termWrapper.writeln(output);
        if (limit-- <= 0) {
          termWrapper.writeln(
            "Result is too large. Showing only the first 1000 lines.",
          );
          break;
        }
      }
    };
    while (true) {
      termWrapper.startPromptMode(`neondb=${isTransaction ? "*" : ""}> `);
      termWrapper.showCursor();
      const line = await termWrapper.waitLine();
      analytics.track("query_started");
      termWrapper.stopPromptMode();
      termWrapper.addLine();
      try {
        if (line === "\\q") {
          this.showBanner();
        } else if (line.startsWith("\\ai ")) {
          analytics.track("ai_query_started");
          const generatedSql = await client.textToSql.mutate({
            text: line.slice(4),
          });
          if (generatedSql.startsWith("SQL: ")) {
            const sql = generatedSql.slice(5);
            termWrapper.addLine();
            termWrapper.write("Generated SQL: `");
            termWrapper.writeChunks(termWrapper.wrapSql(sql));
            termWrapper.writeln("`");
            termWrapper.addLine();
            await performQuery(sql);
            analytics.track("ai_query_finished");
          } else {
            if (generatedSql.startsWith("ERROR: ")) {
              termWrapper.writeln(generatedSql, Color.Red);
              // limit too big payload
              analytics.track("ai_query_error", {
                error: generatedSql.slice(0, 100),
              });
            } else {
              termWrapper.writeln(
                "Sorry, we were unable to successfully convert your prompt to SQL.",
              );
              analytics.track("ai_query_error", { error: generatedSql });
            }
          }
        } else {
          await performQuery(line);
          analytics.track("query_finished");
        }
      } catch (error) {
        const pgError = error as DatabaseError;
        termWrapper.write("ERROR: ", Color.Red);
        termWrapper.writeln(pgError.message);

        if (pgError.hint) {
          termWrapper.write("HINT: ", Color.Yellow);
          termWrapper.writeln(pgError.hint);
        }
        analytics.track("query_error", {
          message: pgError.message,
          code: pgError.code,
        });
        if (isConnectionError(error)) {
          termWrapper.writeln("To start a new connection, press Enter");
          return;
        }
        if (!("code" in pgError)) {
          Sentry.captureException(error);
        }
      } finally {
        termWrapper.addLine();
      }
    }
  }

  async pickTemplate() {
    const templates = await client.listTemplates.query();
    const select = new Select(
      this.appNode,
      this.inputManager,
      templates.map(({ name, description }) => ({
        value: name,
        description,
      })),
    );
    const selectedTemplate = await select.pickOption();
    this.sourceBranch = templates.find(
      (template) => template.name === selectedTemplate.value,
    )?.branch;
    analytics.track("template_selected", { template: selectedTemplate.value });
    select.disable();
  }

  async start() {
    const { termWrapper, inputManager } = this;
    inputManager.init();
    termWrapper.init();
    if (this.appMode === AppMode.Templates) {
      termWrapper.writeln("Welcome to Neon! To start, select a dataset:");
      await this.pickTemplate();
    } else {
      termWrapper.write("Welcome to Neon! To start, press Enter");
      termWrapper.showCursor();
      await termWrapper.waitLine();
    }

    while (true) {
      analytics.track("new_connection");
      try {
        await this.startConnection();
      } catch (error) {
        Sentry.captureException(error);
      }
      await termWrapper.waitLine();
    }
  }

  showBanner() {
    analytics.track("info_banner_shown");
    document.body.classList.add("banner-visible");
  }

  hideBanner() {
    if (!document.body.classList.contains("banner-visible")) {
      return;
    }
    analytics.track("info_banner_hidden");
    document.body.classList.remove("banner-visible");
    this.inputManager.focus();
  }
}
