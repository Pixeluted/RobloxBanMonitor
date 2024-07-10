import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  Interaction,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { MonitoredAccountModel } from "../../models/MonitoredAccount";
import { RobloxAPI } from "../../RobloxAPI";
import { randomUUID } from "crypto";

class ManageAccountsInstance {
  private interaction: ChatInputCommandInteraction<"cached">;
  private client: Client;

  private currentCommandState: "BROWSING" | "MANAGING" = "BROWSING";
  private currentManagingDocument: any = null;

  private listOfAccounts: any[] = [];
  private accountsPerPage = 5;
  private currentPage = 1;
  private totalPages = 0;

  private sessionKey: string;

  constructor(
    interaction: ChatInputCommandInteraction<"cached">,
    client: Client
  ) {
    this.interaction = interaction;
    this.client = client;
    this.sessionKey = randomUUID();
    this.initialize();
  }

  private async renderEmbed() {
    if (this.currentCommandState === "BROWSING") {
      const renderedObjects = this.listOfAccounts.slice(
        (this.currentPage - 1) * this.accountsPerPage,
        this.currentPage * this.accountsPerPage
      );

      let finalDescription = "";
      for (let i = 0; i < renderedObjects.length; i++) {
        const account = renderedObjects[i];
        finalDescription =
          finalDescription + i + `. ${account.username} - ${account.userId}\n`;
      }

      const finalEmbed = new EmbedBuilder()
        .setTitle("Monitored Accounts Management")
        .setDescription(finalDescription)
        .setTimestamp()
        .setColor("White")
        .setFooter({
          text: `Page ${this.currentPage} | Developed by Pixeluted with ❤️`,
        });

      const pageControlsActionRow =
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel("<")
            .setStyle(ButtonStyle.Primary)
            .setCustomId("LEFT|" + this.sessionKey)
            .setDisabled(this.currentPage === 1),
          new ButtonBuilder()
            .setLabel(">")
            .setStyle(ButtonStyle.Primary)
            .setCustomId("RIGHT|" + this.sessionKey)
            .setDisabled(this.currentPage === this.totalPages)
        );

      const managementControlActionRow =
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("SELECT|" + this.sessionKey)
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(
              renderedObjects.map((account) => {
                return {
                  label: account.username + " - " + account.userId,
                  value: account.userId.toString(),
                };
              })
            )
        );

      await this.interaction.editReply({
        embeds: [finalEmbed],
        components: [managementControlActionRow, pageControlsActionRow],
      });

      const filter = (x: Interaction) => x.user.id == this.interaction.user.id;
      const interactionCollector =
        this.interaction.channel?.createMessageComponentCollector({
          time: 60_000, // 1 Min
          filter,
        });

      interactionCollector?.on("collect", async (collectedInteraction) => {
        const splitData = collectedInteraction.customId.split("|");
        if (splitData[1] !== this.sessionKey) return;

        if (collectedInteraction.isButton()) {
          if (splitData[0] == "LEFT") {
            this.currentPage = this.currentPage - 1;
          } else {
            this.currentPage = this.currentPage + 1;
          }

          interactionCollector.stop();
          await collectedInteraction.deferUpdate();
          await this.renderEmbed();
        } else if (collectedInteraction.isStringSelectMenu()) {
          const managingAccountId = parseInt(collectedInteraction.values[0]);
          const managingDocument = this.listOfAccounts.find(
            (x) => x.userId === managingAccountId
          );
          if (!managingDocument) {
            return await collectedInteraction.reply({
              content: "What the sigma?",
              ephemeral: true,
            });
          }

          this.currentManagingDocument = managingDocument;
          this.currentCommandState = "MANAGING";

          interactionCollector.stop();
          await collectedInteraction.deferUpdate();
          await this.renderEmbed();
        }
      });

      interactionCollector?.on("end", async () => {
        if (interactionCollector.endReason === "user") return;

        await this.interaction.editReply({
          embeds: [finalEmbed],
          components: [],
        });
      });
    } else if (this.currentCommandState === "MANAGING") {
      const managingEmbed = new EmbedBuilder()
        .setTitle(`Monitored account ${this.currentManagingDocument.username}`)
        .addFields([
          {
            name: "Account Username",
            value: this.currentManagingDocument.username,
            inline: true,
          },
          {
            name: "Account UserId",
            value: this.currentManagingDocument.userId.toString(),
            inline: true,
          },
          {
            name: "Is account banned?",
            value:
              this.currentManagingDocument.banStatus === "BANNED"
                ? "Yes"
                : "No",
            inline: true,
          },
          {
            name: "Authorization valid?",
            value:
              this.currentManagingDocument.cookieStatus === "VALID"
                ? "Yes"
                : "No",
            inline: true,
          },
          {
            name: "Added by",
            value: `<@${this.currentManagingDocument.addedBy}>`,
            inline: true,
          },
        ])
        .setTimestamp()
        .setColor("White")
        .setFooter({
          text: "Developed by Pixeluted with ❤️",
        });

      const buttonsActionRow =
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("GOBACK|" + this.sessionKey)
            .setLabel("Go back")
            .setStyle(ButtonStyle.Primary)
        );

      await this.interaction.editReply({
        embeds: [managingEmbed],
        components: [buttonsActionRow],
      });

      const filter = (x: Interaction) => x.user.id == this.interaction.user.id;
      const interactionCollector =
        this.interaction.channel?.createMessageComponentCollector({
          time: 60_000, // 1 Min
          filter,
        });

      interactionCollector?.on("collect", async (collectedInteraction) => {
        if (!collectedInteraction.isButton()) return;
        const splitData = collectedInteraction.customId.split("|");
        if (splitData[1] !== this.sessionKey) return;

        if (splitData[0] === "GOBACK") {
          this.currentCommandState = "BROWSING";
          this.currentManagingDocument = null;
        }

        interactionCollector.stop();
        await collectedInteraction.deferUpdate();
        await this.renderEmbed();
      });

      interactionCollector?.on("end", async () => {
        if (interactionCollector.endReason === "user") return;

        await this.interaction.editReply({
          embeds: [managingEmbed],
          components: [],
        });
      });
    }
  }

  private async initialize() {
    await this.interaction.deferReply({ ephemeral: true });

    if (this.interaction.user.id !== process.env.BOT_OWNER_USER_ID) {
      return await this.interaction.editReply({
        content: "You do not have permission to use this command!",
      });
    }

    const allMonitoredAccounts = await MonitoredAccountModel.where();

    if (allMonitoredAccounts.length === 0) {
      return await this.interaction.editReply({
        content: "You don't have any monitored accounts added!",
      });
    }

    this.totalPages = Math.ceil(
      allMonitoredAccounts.length / this.accountsPerPage
    );
    this.listOfAccounts = allMonitoredAccounts;

    for (const account of this.listOfAccounts) {
      let accountUsername = await RobloxAPI.getUsernameFromUserId(
        account.userId
      );
      if (!accountUsername) {
        accountUsername = "Couldn't fetch";
      }

      account.username = accountUsername;
    }

    this.renderEmbed();
  }
}

export default {
  data: new SlashCommandBuilder()
    .setName("manage-accounts")
    .setDescription("Lists all monitored accounts and lets you manage them!"),
  async execute(
    interaction: ChatInputCommandInteraction<"cached">,
    client: Client
  ) {
    new ManageAccountsInstance(interaction, client);
  },
};
