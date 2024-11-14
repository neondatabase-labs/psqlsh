import { Pool } from "@neondatabase/serverless";
import * as psql from "psql-describe";
import { formatOutput } from "./psql";
import { analytics } from "./analytics";

export async function* performDbQuery(
  pool: Pool,
  query: string,
  onIsTransaction: (isTransaction: boolean) => void,
) {
  const pgClient = await pool.connect();
  pgClient.on("error", (err) => {
    console.log("Unexpected error on client", err);
  });
  // deal with backslash describe commands
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

    const { promise: describePromise } = psql.describe(
      query.replace(/;$/, ""),
      database.current_database,
      (sqlText) => pgClient.query({ text: sqlText, rowMode: "array" }),
      (item) => {
        analytics.track("bslash_command", { command: query });
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

  const {
    rows: [isTx],
  } = await pgClient.query(
    "select now() = statement_timestamp() as is_not_transaction",
  );
  onIsTransaction(!isTx.is_not_transaction);

  const resultAsArray = Array.isArray(result) ? result : [result];

  for (let i = 0; i < resultAsArray.length; i++) {
    const resultBlock = resultAsArray[i];
    if (resultBlock.fields.length === 0) {
      yield resultBlock.command || "Query returned no results";
      continue;
    }

    for (const row of formatOutput(resultBlock)) {
      yield row;
    }
    if (i < resultAsArray.length - 1) {
      yield "";
    }
  }

  pgClient.release();
}
