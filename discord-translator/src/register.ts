/**
 * One-off script to register global application commands with Discord.
 * Run with: `tsx src/register.ts`
 * Requires .dev.vars or env: DISCORD_APP_ID, DISCORD_BOT_TOKEN.
 */
import { readFileSync } from "node:fs";

loadDevVars();

const APP_ID = must("DISCORD_APP_ID");
const TOKEN = must("DISCORD_BOT_TOKEN");

const commands = [
  {
    name: "translate",
    description: "Translate text between Korean and English",
    options: [
      {
        name: "text",
        description: "Text to translate",
        type: 3, // STRING
        required: true,
      },
    ],
  },
  {
    name: "Translate",
    type: 3, // MESSAGE context menu
  },
];

const res = await fetch(`https://discord.com/api/v10/applications/${APP_ID}/commands`, {
  method: "PUT",
  headers: {
    Authorization: `Bot ${TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(commands),
});

const body = await res.text();
console.log(res.status, body);
if (!res.ok) process.exit(1);

function must(k: string): string {
  const v = process.env[k];
  if (!v) throw new Error(`${k} is required`);
  return v;
}

function loadDevVars(): void {
  try {
    const raw = readFileSync(".dev.vars", "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    // no .dev.vars — rely on process env
  }
}
