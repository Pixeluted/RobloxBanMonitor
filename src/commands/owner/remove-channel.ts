import {
  SlashCommandBuilder,
  SlashCommandChannelOption,
  ChannelType,
  ChatInputCommandInteraction,
  Client,
} from "discord.js";
import { NotificationChannelModel } from "../../models/NotificationChannel";

export default {
  data: new SlashCommandBuilder()
    .setName("remove-channel")
    .setDescription("Removes channel from ban notifications being sent to!")
    .addChannelOption(() => {
      return new SlashCommandChannelOption()
        .setName("channel")
        .setDescription("The channel to remove!")
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

    const channelData = await NotificationChannelModel.findOne({
      channelId: channel.id,
    });

    if (!channelData) {
      return await interaction.editReply({
        content: "This channel is not even added.",
      });
    }

    await NotificationChannelModel.deleteOne({
      channelId: channel.id,
    });

    await interaction.editReply({
      content: "Channel removed!",
    });
  },
};
