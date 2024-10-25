import { Pool } from "@neondatabase/serverless";

import { TermWrapper } from "./termWrapper";
import { client } from "./api";
import { performDbQuery } from "./dbQuery";
import { Color } from "./color";

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
      console.log("Error:", error);
      return;
    }
    const pgPool = new Pool({
      connectionString,
    });
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
      console.log("Error:", error);
      return;
    }
    termWrapper.writeln('Type "\\?" for help.');
    while (true) {
      termWrapper.startPromptMode("neondb=> ");
      termWrapper.showCursor();
      const line = await termWrapper.waitLine();
      termWrapper.stopPromptMode();
      termWrapper.addLine();
      try {
        if (line === "\\q") {
          this.showBanner();
        } else {
          termWrapper.hideCursor();
          let limit = 1000;
          for await (const output of performDbQuery(pgPool, line)) {
            termWrapper.writeln(output);
            if (limit-- <= 0) {
              termWrapper.writeln(
                "The query returned more than 1000 rows. Showing only the first 1000 rows.",
              );
              break;
            }
          }
        }
      } catch (error: any) {
        termWrapper.write("ERROR: ", Color.Red);
        termWrapper.writeln(error.message);
        console.log("Error:", error);
        if (isConnectionError(error)) {
          termWrapper.writeln("To start a new connection, press Enter");
          return;
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
      await this.startConnection();
    }
  }

  showBanner() {
    document.body.classList.add("banner-visible");
  }

  hideBanner() {
    document.body.classList.remove("banner-visible");
    this.termWrapper.focus();
  }
}
