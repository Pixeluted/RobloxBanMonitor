import axios from "axios";
import {
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { BanAPI, RobloxAPI } from "../../RobloxAPI";
import { MonitoredAccountModel } from "../../models/MonitoredAccount";

export default {
  data: new SlashCommandBuilder()
    .setName("add-account")
    .setDescription("Adds a account to the DB to be monitored!")
    .addStringOption((option) =>
      option
        .setName("cookie")
        .setDescription("The .ROBLOSECURITY cookie for this account!")
        .setRequired(true)
    ),
  async execute(
    interaction: ChatInputCommandInteraction<"cached">,
    client: Client
  ) {
    await interaction.deferReply({
      ephemeral: true,
    });

    if (interaction.user.id !== process.env.BOT_OWNER_USER_ID) {
      return await interaction.editReply({
        content: "You do not have permissions to use this command!",
      });
    }

    const accountCookie = interaction.options.getString("cookie", true);
    const isValidCookie = await RobloxAPI.verifyRobloxCookie(accountCookie);

    if (!isValidCookie) {
      return await interaction.editReply({
        content: "The cookie your provided is invalid!",
      });
    }

    const accountBanData = await BanAPI.isAccountBanned(accountCookie, true);
    if (accountBanData === false) {
      return await interaction.editReply({
        content: "Failed to fetch ban status for this account!",
      });
    }

    if (accountBanData !== null) {
      return await interaction.editReply({
        content:
          "Cannot add a banned account already, because we cannot fetch info from banned user!",
      });
    }

    const accountInfo = await RobloxAPI.getAuthenticatedUserInfo(accountCookie);
    if (!accountInfo) {
      return await interaction.editReply({
        content: "Failed to fetch account info for this account!",
      });
    }

    const isAlreadyAdded = await MonitoredAccountModel.findOne({
      userId: accountInfo.id,
    });

    if (isAlreadyAdded) {
      if (isAlreadyAdded.cookieStatus === "VALID") {
        return await interaction.editReply({
          content: "This account is already added!",
        });
      }

      await MonitoredAccountModel.updateOne(
        {
          userId: accountInfo.id,
        },
        {
          accountCookie: accountCookie,
          cookieStatus: "VALID",
        }
      );

      return await interaction.editReply({
        content: "Cookie got sucessufully updated!",
      });
    }

    await new MonitoredAccountModel({
      userId: accountInfo.id,
      accountCookie,
      banStatus: "UNBANNED",
      cookieStatus: "VALID",
      addedBy: interaction.user.id,
    }).save();

    await interaction.editReply({
      content: `Added ${accountInfo.displayName} to the ban monitoring!`,
    });
  },
};
