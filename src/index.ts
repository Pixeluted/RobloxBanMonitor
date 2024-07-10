require("dotenv").config();
import chalk from "chalk";
import { Client, Partials } from "discord.js";
import fs from "fs";
import mongoose from "mongoose";
import path from "path";

if (!process.env.BOT_OWNER_USER_ID) {
  console.log(
    chalk.red("[CONFIG] You didn't provide UserID of the bot owner!")
  );
  process.exit();
}

if (!process.env.DATABASE_URL) {
  console.log(chalk.red("[ERROR] You didn't provide MongoDB URL!"));
  process.exit();
}

mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => {
    console.log(chalk.green("[DATABASE] Sucessfully connected to MongoDB!"));
  })
  .catch((err) => {
    console.log(chalk.red("[DATABASE] Failed to connect to MongoDB: "));
    console.log(err);
  });

export const client = new Client({
  intents: ["Guilds", "GuildMessages"],
  partials: [
    Partials.GuildMember,
    Partials.Message,
    Partials.User,
    Partials.Channel,
  ],
});

function runStartupFiles() {
  const startupFiles = fs
    .readdirSync(path.join(__dirname, "./startup"))
    .filter((file) => file.endsWith(".js"));
  for (const file of startupFiles) {
    const startupFile = require(`./startup/${file}`);
    startupFile.execute(client);
  }
}

client.on("ready", () => {
  console.log(chalk.green(`[BOT] Logged in as ${client.user?.username}!`));
  runStartupFiles();
});

if (!process.env.BOT_TOKEN) {
  console.log(chalk.red("[BOT] You didn't provide a bot token!"));
  process.exit();
}

client.login(process.env.BOT_TOKEN).catch((err) => {
  console.log(chalk.red("[BOT] Failed to login into the bot: "));
  console.log(err);
});
