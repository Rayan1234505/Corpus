import { REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const commands = [
  new SlashCommandBuilder()
    .setName("paper")
    .setDescription("Interact with the Smart Research Paper Assistant")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("upload")
        .setDescription("Upload a PDF and start a new research session")
        .addAttachmentOption((option) =>
          option.setName("file").setDescription("The PDF file to upload").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("ask")
        .setDescription("Ask a question about the current session paper")
        .addStringOption((option) =>
          option.setName("question").setDescription("Your question").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("summary").setDescription("Get a structured summary of the loaded paper")
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("status").setDescription("Show current session metadata")
    ),
].map((command) => command.toJSON());

export const registerCommands = async () => {
  const token = process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;

  if (!token || !clientId) {
    console.warn("Skipping standard command registration. Missing DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID.");
    return;
  }

  const rest = new REST({ version: "10" }).setToken(token);

  try {
    console.log("Started refreshing application (/) commands.");
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error("Error registering commands:", error);
  }
};
