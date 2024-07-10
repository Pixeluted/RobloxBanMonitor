import {
  ChannelType,
  ChatInputCommandInteraction,
  Client,
  ClientUser,
  GuildTextBasedChannel,
  SlashCommandBuilder,
  SlashCommandChannelOption,
} from "discord.js";
import { NotificationChannelModel } from "../../models/NotificationChannel";

async function checkForChannelPermissions(
  client: Client,
  channel: GuildTextBasedChannel
) {
  const clientUser = client.user as ClientUser;
  if (channel === null) {
    return false;
  }

  const ourPermissions = channel.permissionsFor(clientUser);

  return (
    ourPermissions?.has("ViewChannel") &&
    ourPermissions?.has("SendMessages") &&
    ourPermissions?.has("EmbedLinks")
  );
}

export default {
  data: new SlashCommandBuilder()
    .setName("add-channel")
    .setDescription("Adds a channel where ban notifications will be sent!")
    .addChannelOption(() => {
      return new SlashCommandChannelOption()
        .setName("channel")
        .setDescription("The channel to add!")
        .addChannelTypes(ChannelType.GuildText)
        .addChannelTypes(ChannelType.GuildAnnouncement)
        .setRequired(true);
    }),
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

    const channel = interaction.options.getChannel("channel", true, [
      ChannelType.GuildText,
      ChannelType.GuildAnnouncement,
    ]);

    const alreadyExists = await NotificationChannelModel.findOne({
      channelId: channel.id,
    });

    if (alreadyExists) {
      return await interaction.editReply({
        content: "This channel is already added!",
      });
    }

    if (!(await checkForChannelPermissions(client, channel))) {
      return await interaction.editReply({
        content: "I cannot send/embed messages in this channel",
      });
    }

    await new NotificationChannelModel({
      channelId: channel.id,
      guildId: channel.guild.id,
    }).save();

    await interaction.editReply({
      content: "Added!",
    });
  },
};
