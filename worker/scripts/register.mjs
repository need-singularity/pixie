// One-shot: register /explain + /ping as global application commands.
//   node scripts/register.mjs
// Reads DISCORD_APPLICATION_ID + DISCORD_BOT_TOKEN from env (or `secret get`).
import { execSync } from "child_process";

function secret(key) {
  return execSync(`/Users/ghost/core/secret/bin/secret get ${key}`).toString().trim();
}

const appId = process.env.DISCORD_APPLICATION_ID || secret("discord.pixie_application_id");
const token = process.env.DISCORD_BOT_TOKEN || secret("discord.pixie_bot_token");

const commands = [
  {
    name: "ping",
    description: "Check that Pixie is alive.",
    type: 1,
  },
  {
    name: "explain",
    description: "Explain a need-singularity project (ephemeral, only you see it).",
    type: 1,
    options: [
      {
        name: "project",
        description: "Project name (anima, nexus, n6-architecture, …).  Omit to list all.",
        type: 3, // STRING
        required: false,
        choices: [
          { name: "🧠 anima",           value: "anima" },
          { name: "🔭 nexus",           value: "nexus" },
          { name: "🏗️ n6-architecture", value: "n6-architecture" },
          { name: "💎 hexa-lang",       value: "hexa-lang" },
          { name: "🐝 hive",            value: "hive" },
          { name: "🕳️ void",            value: "void" },
          { name: "🧬 airgenome",       value: "airgenome" },
          { name: "🔥 campfire",        value: "campfire" },
        ],
      },
    ],
  },
];

const url = `https://discord.com/api/v10/applications/${appId}/commands`;
const res = await fetch(url, {
  method: "PUT",
  headers: {
    "Authorization": `Bot ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(commands),
});

const out = await res.json();
console.log(`HTTP ${res.status}`);
console.log(JSON.stringify(out, null, 2).slice(0, 1200));
