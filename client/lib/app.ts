import { Pool } from "@neondatabase/serverless";

import { TermWrapper } from "./termWrapper";
import { client } from "./api";
import { performDbQuery } from "./dbQuery";
import { showBanner } from "./promo";

export class App {
  async start() {
    const appNode = document.getElementById("app")!;

    const termWrapper = new TermWrapper(appNode);
    termWrapper.init();
    termWrapper.write("Welcome to Neon! To start, press Enter");
    termWrapper.showCursor();

    await termWrapper.waitLine();
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
      termWrapper.writeln(
        `psql (Neon flavor, server ${rows[0].server_version})`,
      );
    } catch (error: any) {
      termWrapper.writeln(`ERROR: ${error.message}`);
      console.log("Error:", error);
      return;
    }
    termWrapper.writeln('Type "\\?" for help.');
    termWrapper.showCursor();
    termWrapper.startPromptMode("neondb=> ");
    while (true) {
      const line = await termWrapper.waitLine();
      termWrapper.stopPromptMode();
      termWrapper.addLine();
      try {
        if (line === "\\q") {
          showBanner();
        } else {
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
        termWrapper.writeln(`ERROR: ${error.message}`);
        console.log("Error:", error);
      } finally {
        termWrapper.addLine();
        termWrapper.startPromptMode("neondb=> ");
      }
    }
  }
}
