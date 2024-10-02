import { Pool } from "@neondatabase/serverless";

import { TermWrapper } from "./termWrapper";
import { client } from "./api";
import { formatOutput } from "./psql";

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
    const { connectionString } = await client.issueDatabase.mutate();
    const pgPool = new Pool({
      connectionString,
    });
    termWrapper.writeln(`Connected to the database!`);
    termWrapper.showCursor();
    termWrapper.startPromptMode();
    while (true) {
      const line = await termWrapper.waitLine();
      termWrapper.stopPromptMode();
      termWrapper.addLine();
      try {
        const pgClient = await pgPool.connect();
        const result = await pgClient.query({
          rowMode: "array",
          text: line,
        });
        if (result.fields.length === 0) {
          termWrapper.writeln("Query returned no results");
          continue;
        }
        for (const row of formatOutput(result)) {
          termWrapper.writeln(row);
        }
        pgClient.release();
      } catch (error: any) {
        termWrapper.writeln(`ERROR: ${error.message}`);
        console.log("Error:", error);
      } finally {
        termWrapper.startPromptMode();
      }
    }
  }
}
