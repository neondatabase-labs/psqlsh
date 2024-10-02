import { QueryArrayResult } from "@neondatabase/serverless";
import { Table } from "./table";

export const formatOutput = (result: QueryArrayResult) => {
  const table = new Table();
  for (const field of result.fields) {
    table.addColumn(field.name);
  }
  for (const row of result.rows) {
    const tableRow = table.addRow();
    for (const value of row) {
      tableRow.addCell(value);
    }
  }
  return table.print();
};
