import {
  Client,
  GatewayIntentBits,
  MessageFlags,
  EmbedBuilder,
} from "discord.js";
import dotenv from "dotenv";
import { registerCommands } from "./commands.js";

// We can communicate with the local @corpus/api to maintain single-source-of-truth.
const API_BASE = process.env.API_URL || "http://localhost:3000/api";

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.once("ready", async () => {
  console.log(`Bot ready as ${client.user?.tag}`);
  await registerCommands();
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "paper") {
    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === "upload") {
        await interaction.deferReply();
        const attachment = interaction.options.getAttachment("file", true);

        if (attachment.contentType !== "application/pdf") {
          await interaction.editReply("Please upload a valid PDF file.");
          return;
        }

        // Fetch the file buffer from discord
        const fileResponse = await fetch(attachment.url);
        const arrayBuffer = await fileResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to our API
        const formData = new FormData();
        const blob = new Blob([buffer], { type: "application/pdf" });
        formData.append("file", blob, attachment.name);

        const uploadRes = await fetch(`${API_BASE}/sessions`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          await interaction.editReply(
            `Failed to process PDF: ${errData.error}`,
          );
          return;
        }

        const data = await uploadRes.json();

        // Send the reply confirming creation before trying to make a thread on it
        const replyMessage = await interaction.editReply(
          `Session created! ID: ${data.id}. See the thread below.`,
        );

        // Ensure thread is created for this session
        const channel = interaction.channel;
        if (channel && "threads" in channel && "name" in channel) {
          const thread = await channel.threads.create({
            name: `Paper: ${data.metadata.title.substring(0, 30)}`,
            reason: `Research session for ${data.id}`,
            startMessage: replyMessage.id,
          });

          const embed = new EmbedBuilder()
            .setTitle(data.metadata.title || "Unknown Title")
            .setDescription(data.metadata.abstract || "No abstract extracted.")
            .addFields({ name: "Session ID", value: data.id });

          await thread.send({
            content:
              "Session created successfully. You can ask questions in this thread!",
            embeds: [embed],
          });
        }
      }

      if (
        subcommand === "ask" ||
        subcommand === "summary" ||
        subcommand === "status"
      ) {
        await interaction.deferReply();

        if (!interaction.channel?.isThread()) {
          await interaction.editReply(
            "Please use this command inside a paper session thread created by `/paper upload`.",
          );
          return;
        }

        const starterMessage = await interaction.channel
          .fetchStarterMessage()
          .catch(() => null);
        let sessionId: string | undefined;
        if (starterMessage) {
          const match = starterMessage.content.match(/ID: ([a-z0-9-]+)\./);
          if (match) sessionId = match[1];
        }

        if (!sessionId) {
          // Fallback checking messages in thread for the embed
          const msgs = await interaction.channel.messages.fetch({ limit: 10 });
          for (const msg of msgs.values()) {
            if (msg.embeds.length > 0) {
              const field = msg.embeds[0].fields.find(
                (f) => f.name === "Session ID",
              );
              if (field) {
                sessionId = field.value;
                break;
              }
            }
          }
        }

        if (!sessionId) {
          await interaction.editReply(
            "Could not find the Session ID for this thread. Please start a new session.",
          );
          return;
        }

        if (subcommand === "status") {
          try {
            const res = await fetch(`${API_BASE}/sessions/${sessionId}`);
            if (!res.ok) {
              await interaction.editReply("Could not fetch session status.");
              return;
            }
            const data = await res.json();
            const embed = new EmbedBuilder()
              .setTitle(
                `Status: ${data.paperMetadata?.title || "Unknown Paper"}`,
              )
              .addFields(
                { name: "Session ID", value: data.id },
                {
                  name: "Messages",
                  value: `${data.conversationHistory?.length || 0}`,
                  inline: true,
                },
                {
                  name: "Created",
                  value: new Date(data.createdAt).toLocaleString(),
                  inline: true,
                },
              );
            await interaction.editReply({ embeds: [embed] });
          } catch (err: any) {
            await interaction.editReply(
              `Error fetching status: ${err.message}`,
            );
          }
          return;
        }

        let question = "";
        if (subcommand === "summary") {
          question =
            "Please provide a detailed, structured summary of this paper.";
        } else {
          question = interaction.options.getString("question", true);
        }

        try {
          const askRes = await fetch(
            `${API_BASE}/sessions/${sessionId}/messages`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content: question }),
            },
          );

          if (!askRes.ok) {
            const errData = await askRes.json().catch(() => ({}));
            await interaction.editReply(
              `API Error: ${errData.error || askRes.statusText}`,
            );
            return;
          }

          const data = await askRes.json();
          const answer = data.message?.content || "No response received.";

          // Split response if it's too long for Discord (2000 chars limit)
          if (answer.length > 1900) {
            await interaction.editReply(
              `**${subcommand === "summary" ? "Summary" : "Q: " + question}**\n\n**A:** ${answer.substring(0, 1850)}... [Response truncated]`,
            );
          } else {
            await interaction.editReply(
              `**${subcommand === "summary" ? "Summary" : "Q: " + question}**\n\n**A:** ${answer}`,
            );
          }
        } catch (err: any) {
          await interaction.editReply(`Error reaching API: ${err.message}`);
        }
      }
    } catch (error) {
      console.error(error);
      const msg = "An error occurred handling this command.";
      if (interaction.deferred) {
        await interaction.editReply(msg);
      } else {
        await interaction.reply({
          content: msg,
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
