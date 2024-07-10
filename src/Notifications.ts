import { Client, EmbedBuilder, TextChannel } from "discord.js";
import { NotificationChannelModel } from "./models/NotificationChannel";
import { BanInformation, RobloxAPI } from "./RobloxAPI";
import { client } from ".";

export async function sendBanStatusUpdate(
  UpdateType: "BANNED" | "UNBANNED",
  userId: number,
  banInfo: BanInformation | null
) {
  const accountUsername = await RobloxAPI.getUsernameFromUserId(userId);
  if (accountUsername === null) return;

  let notificationEmbed;
  if (UpdateType === "BANNED") {
    notificationEmbed = new EmbedBuilder()
      .setTitle(`${accountUsername} just got banned!`)
      .setDescription("GG")
      .addFields([
        {
          name: "Account Name",
          value: accountUsername,
          inline: true,
        },
        {
          name: "Ban Reason",
          value: banInfo?.banType as string,
          inline: true,
        },
        {
          name: "Ban Start",
          value: `<t:${banInfo?.banStartUnix}:f>`,
          inline: true,
        },
        {
          name: "Ban End",
          value: `<t:${banInfo?.banEndUnix}:f>`,
          inline: true,
        },
      ])
      .setTimestamp()
      .setColor("Red")
      .setFooter({ text: "Developed by Pixeluted with ❤️" });
  } else if (UpdateType === "UNBANNED") {
    notificationEmbed = new EmbedBuilder()
      .setTitle(`${accountUsername} got unbanned!`)
      .setDescription("Welcome back from your punishment " + accountUsername)
      .setColor("Green")
      .setTimestamp()
      .setFooter({ text: "Developed by Pixeluted with ❤️" });
  }

  const allNotificationChannels = await NotificationChannelModel.where();

  for (const notificationChannelData of allNotificationChannels) {
    try {
      const notificationChannelGuild = await client.guilds.fetch(
        notificationChannelData.guildId
      );
      const notificationChannel =
        (await notificationChannelGuild.channels.fetch(
          notificationChannelData.channelId
        )) as TextChannel;

      notificationChannel.send({
        content: "@everyone",
        embeds: [notificationEmbed as EmbedBuilder],
      });
    } catch {}
  }
}

export async function sendCookieInvalidUpdate(
  userId: number,
  addedById: string
) {
  const allNotificationChannels = await NotificationChannelModel.where();
  for (const notificationChannelData of allNotificationChannels) {
    try {
      const notificationChannelGuild = await client.guilds.fetch(
        notificationChannelData.guildId
      );
      const notificationChannel =
        (await notificationChannelGuild.channels.fetch(
          notificationChannelData.channelId
        )) as TextChannel;

      notificationChannel.send({
        content: `<@${addedById}> Account with the UserID ${userId} has expired cookie! Please update it by using /add-account!\nAccount Link: https://roblox.com/users/${userId}`,
      });
    } catch {}
  }
}