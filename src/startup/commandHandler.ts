import { Client, Collection } from "discord.js";
import fs from "fs";
import path from "path";

let commands = new Collection();

export async function execute(client: Client) {
  const commandsFolder = fs.readdirSync(path.join(__dirname, "..", "commands"));

  for (const folder of commandsFolder) {
    const commandFiles = fs
      .readdirSync(path.join(__dirname, "..", "commands", folder))
      .filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
      const command = require(`../commands/${folder}/${file}`).default;
      commands.set(command.data.name, command);
    }
  }

  client.application?.commands.set(
    commands.map((command: any) => command.data)
  );

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const command: any = commands.get(interaction.commandName);

    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      if (interaction.replied) {
        return await interaction.editReply({
          content: "There was an error while executing this command!",
        });
      }

      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  });
}
