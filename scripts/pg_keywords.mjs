#!/usr/bin/env node

import { JSDOM } from "jsdom";
import { writeFile } from "node:fs/promises";

const KEYWORDS_URL =
  "https://www.postgresql.org/docs/current/sql-keywords-appendix.html";
const DEST_FILE = "client/public/keywords.json";

fetch(KEYWORDS_URL)
  .then((res) => res.text())
  .then((html) => {
    const dom = new JSDOM(html);
    const results = [];
    dom.window.document
      .querySelectorAll("#KEYWORDS-TABLE table tbody tr")
      .forEach((row) => {
        const columns = row.querySelectorAll("td");
        results.push(columns[0].textContent.replace(/\s/g, "").toLowerCase());
      });
    return results;
  })
  .then((keywords) => {
    return writeFile(DEST_FILE, JSON.stringify({ keywords }, null, 2));
  })
  .then(() => {
    console.log(`Keywords written to ${DEST_FILE}`);
  });
