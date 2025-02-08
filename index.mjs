#!/usr/bin/env node

import sqlite3 from "sqlite3";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  GetPromptRequestSchema,
  CompleteRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server({
  name: "sqlite-context-server",
  version: "0.1.2",
});

const databasePath = process.env.DATABASE_PATH;
if (!databasePath) {
  console.error("Please provide a DATABASE_PATH environment variable");
  process.exit(1);
}

process.stderr.write("starting server. path: " + databasePath + "\n");
const db = new sqlite3.Database(databasePath);

const SCHEMA_PATH = "schema";
const SCHEMA_PROMPT_NAME = "sqlite-schema";
const ALL_TABLES = "all-tables";

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
      (err, rows) => {
        if (err) reject(err);
        resolve({
          resources: rows.map((row) => ({
            uri: `sqlite://${row.name}/${SCHEMA_PATH}`,
            mimeType: "application/json",
            name: `"${row.name}" database schema`,
          })),
        });
      },
    );
  });
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const resourceUrl = new URL(request.params.uri);
  const pathComponents = resourceUrl.pathname.split("/");
  const schema = pathComponents.pop();
  const tableName = pathComponents.pop();

  if (schema !== SCHEMA_PATH) {
    throw new Error("Invalid resource URI");
  }

  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
      if (err) reject(err);
      resolve({
        contents: [
          {
            uri: request.params.uri,
            mimeType: "application/json",
            text: JSON.stringify(rows, null, 2),
          },
        ],
      });
    });
  });
});

// Similar handler implementations for ListToolsRequestSchema, CallToolRequestSchema, etc.
// Adapt the SQL queries to use SQLite syntax

async function getSchema(tableName) {
  return new Promise((resolve, reject) => {
    if (tableName === ALL_TABLES) {
      db.all(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
        (err, tables) => {
          if (err) reject(err);
          Promise.all(
            tables.map(
              (table) =>
                new Promise((resolve, reject) => {
                  db.all(`PRAGMA table_info(${table.name})`, (err, columns) => {
                    if (err) reject(err);
                    resolve({ tableName: table.name, columns });
                  });
                }),
            ),
          ).then((results) => {
            let sql = "```sql\n";
            results.forEach(({ tableName, columns }) => {
              sql += `CREATE TABLE "${tableName}" (\n`;
              sql += columns
                .map(
                  (col) =>
                    `  "${col.name}" ${col.type}${
                      col.notnull ? " NOT NULL" : ""
                    }${col.dflt_value ? ` DEFAULT ${col.dflt_value}` : ""}`,
                )
                .join(",\n");
              sql += "\n);\n\n";
            });
            sql += "```";
            resolve(sql);
          });
        },
      );
    } else {
      db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
        if (err) reject(err);
        let sql = "```sql\n";
        sql += `CREATE TABLE "${tableName}" (\n`;
        sql += columns
          .map(
            (col) =>
              `  "${col.name}" ${col.type}${
                col.notnull ? " NOT NULL" : ""
              }${col.dflt_value ? ` DEFAULT ${col.dflt_value}` : ""}`,
          )
          .join(",\n");
        sql += "\n);\n```";
        resolve(sql);
      });
    }
  });
}

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

runServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
