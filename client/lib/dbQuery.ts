import { Pool } from "@neondatabase/serverless";
import * as psql from "psql-describe";
import { formatOutput } from "./psql";

export async function* performDbQuery(pool: Pool, query: string) {
  const pgClient = await pool.connect();
  if (query.startsWith("\\")) {
    let descriptiveText = "";
    const {
      rows: [database],
    } = await pgClient.query(`select current_database()`);
    const {
      rows: [serverVersionNum],
    } = await pgClient.query(`show server_version_num`);
    const {
      rows: [standardConformingStrings],
    } = await pgClient.query(`show standard_conforming_strings`);
    // deal with backslash describe commands

    const { promise: describePromise } = psql.describe(
      query,
      database,
      (sqlText) => pgClient.query({ text: sqlText, rowMode: "array" }),
      (item) => {
        descriptiveText += psql.describeDataToString(item);
      },
      false,
      serverVersionNum.server_version_num,
      standardConformingStrings.standard_conforming_strings === "on",
      (id) => `https://neon.tech/docs/postgres/${id}`,
    );

    await describePromise;
    for (const line of descriptiveText.split("\n")) {
      yield line;
    }
    return;
  }

  const result = await pgClient.query({
    rowMode: "array",
    text: query,
  });

  if (result.fields.length === 0) {
    yield result.command || "Query returned no results";
    return;
  }

  for (const row of formatOutput(result)) {
    yield row;
  }

  pgClient.release();
}
