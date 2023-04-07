const log = require('npmlog');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const util = require('../util.js');
const config = require('../config.js');

module.exports = {
	data: new SlashCommandBuilder().setName('stop').setDescription('stop recording!'),
	async execute(interaction) {

		const currentVoiceChannel = await getVoiceConnection(interaction.guild.id);

		if (currentVoiceChannel) {

			// Stop the current write stream to close the file
			await util.writeStream.destroy();

			// We are leaving the channel, no need for the timeoutTimer now
			// await util.stopTimeoutTimer();

			// Leave the current voice channel
			await currentVoiceChannel.destroy();
			log.info('Stopped Recording');

			// Prevent double `reply` calls if auto-stopping recording
			if (!interaction.replied) {
				await interaction.reply({ content: 'Stopped recording!', ephemeral: true });
			}

		} else {
			await interaction.reply({ content: 'I am not recording!', ephemeral: true });
		}
	},
};