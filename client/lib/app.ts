import { Pool } from "@neondatabase/serverless";
import * as Sentry from "@sentry/browser";

import { TermWrapper } from "./termWrapper";
import { client } from "./api";
import { performDbQuery } from "./dbQuery";
import { Color } from "./color";
import { analytics } from "./analytics";

function isConnectionError(err: unknown) {
  if (err instanceof Error && "code" in err) {
    return err.code === "XX000";
  }

  return false;
}

export class App {
  termWrapper: TermWrapper;

  constructor() {
    const appNode = document.getElementById("app")!;
    this.termWrapper = new TermWrapper(appNode);
  }

  async startConnection() {
    const { termWrapper } = this;
    termWrapper.hideCursor();
    termWrapper.addLine();
    termWrapper.writeln(`Starting the database connection...`);
    let connectionString: string;
    try {
      const response = await client.issueDatabase.mutate();
      connectionString = response.connectionString;
    } catch (error: any) {
      termWrapper.writeln(`ERROR: ${error.message}`);
      analytics.track("database_issue_error", { message: error.message });
      console.log("Error:", error);
      return;
    }
    const pgPool = new Pool({
      connectionString,
    });
    analytics.track("database_issued");
    try {
      const pgClient = await pgPool.connect();
      const { rows } = await pgClient.query("show server_version");
      if (rows.length === 0) {
        termWrapper.writeln("Something went wrong. Please try again.");
      }
      termWrapper.write(`psql (Neon flavor, server `);
      termWrapper.write(rows[0].server_version, Color.Green);
      termWrapper.writeln(`)`);
    } catch (error: any) {
      termWrapper.writeln(`ERROR: ${error.message}`);
      analytics.track("database_connection_error", { message: error.message });
      console.log("Error:", error);
      return;
    }
    analytics.track("database_connected");
    termWrapper.writeln('Type "\\?" for help.');
    let isTransaction = false;
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
        } else {
          termWrapper.hideCursor();
          let limit = 1000;
          for await (const output of performDbQuery(
            pgPool,
            line,
            (isTransactionIn) => {
              isTransaction = isTransactionIn;
            },
          )) {
            termWrapper.writeln(output);
            if (limit-- <= 0) {
              termWrapper.writeln(
                "The query returned more than 1000 rows. Showing only the first 1000 rows.",
              );
              break;
            }
          }
          analytics.track("query_finished");
        }
      } catch (error: any) {
        termWrapper.write("ERROR: ", Color.Red);
        termWrapper.writeln(error.message);
        analytics.track("query_error", { message: error.message });
        if (isConnectionError(error)) {
          termWrapper.writeln("To start a new connection, press Enter");
          return;
        }
        if (!("code" in error)) {
          Sentry.captureException(error);
        }
      } finally {
        termWrapper.addLine();
      }
    }
  }

  async start() {
    const { termWrapper } = this;
    termWrapper.init();
    termWrapper.write("Welcome to Neon! To start, press Enter");
    termWrapper.showCursor();

    document.getElementById("info")!.addEventListener("click", this.showBanner);
    document.getElementById("back")!.addEventListener("click", this.hideBanner);
    document.addEventListener("keydown", (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        this.hideBanner();
      }
    });

    while (true) {
      await termWrapper.waitLine();
      analytics.track("new_connection");
      await this.startConnection();
    }
  }

  showBanner() {
    analytics.track("info_banner_shown");
    document.body.classList.add("banner-visible");
  }

  hideBanner() {
    analytics.track("info_banner_hidden");
    document.body.classList.remove("banner-visible");
    this.termWrapper.focus();
  }
}
