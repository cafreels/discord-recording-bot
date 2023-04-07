const log = require('npmlog');
const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { joinVoiceChannel, EndBehaviorType } = require('@discordjs/voice');
const { opus } = require('prism-media');
const util = require('../util.js');
const fs = require('fs');
const { transcribe, heyChatGPT } = require('../openai.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('transcribe')
		.setDescription('Start a transcribing!')
		.addChannelOption(option =>
			option.setName('channel')
				.setDescription('The channel you want to transcribe.')
				.setRequired(true)
				.addChannelTypes(ChannelType.GuildVoice)
		),
	async execute(interaction) {
		// Join the passed in voice channel
		const connection = await joinVoiceChannel({
			channelId: interaction.options.getChannel('channel').id,
			guildId: interaction.guild.id,
			adapterCreator: interaction.guild.voiceAdapterCreator,
			selfDeaf: false
		});

		util.startTimeoutTimer(interaction);

		await interaction.reply({ content: 'Now transcribing in #' + interaction.options.getChannel('channel').name + '!', ephemeral: true });
		log.info('Started Transcribing');

		connection.receiver.speaking.on('start', async (userId) => {
			const fetchedGuildUser = await interaction.guild.members.fetch(userId, { force: true });
			const userNameOfSpeaker = fetchedGuildUser.user.username;

			const userRecordingWriteStream = await util.createNewRecordingForUser(userId);
			log.info(userNameOfSpeaker + ' started speaking');

			// Check if we are already subscribed to a user
			if (!connection.receiver.subscriptions.get(userId)) {
				log.info('Adding new subscription for ' + userNameOfSpeaker + ' started speaking');
				// Subscribe to a user's audio feed when they start talking
				const audioStream = connection.receiver.subscribe(userId, {
					end: {
						behavior: EndBehaviorType.AfterSilence,
						duration: 1000
					}
				});

				// Create an opus decoder and pipe the user's audioStream into that
				const decoder = new opus.Decoder({ frameSize: 960, channels: 2, rate: 48000 });
				const rawAudio = await audioStream.pipe(decoder);

				//  Pipe the decoded audioStream into the user's writable stream
				rawAudio.pipe(userRecordingWriteStream);

				// User has stopped talking, transcribe the audio and post it to the Discord channel
				audioStream.on('end', async () => {
					// Get timestamp for message
					const currentDate = new Date();



					log.info(userNameOfSpeaker + ' stopped speaking');
					await userRecordingWriteStream.destroy();
					const recordingFilePath = userRecordingWriteStream.path;
					const outputMP3FilePath = recordingFilePath.replace('.pcm', '.mp3');
					try {
						// Try to convert the recording to a .mp3
						await util.convertFile(recordingFilePath, outputMP3FilePath, async function (err) {
							if (err) {
								log.error(err);
								interaction.channel.send({ content: 'An error occurred processing the recording!' });
								return;
							}
							// Success, post the new .mp3 to the Discord channel
							log.info('Conversion Complete');
							// const convertedFileName = userFilePath.replace(/\.[^/.]+$/, "") + '.mp3';


							const formattedTime = currentDate.toLocaleTimeString();

							// transcaibe the audio
							const text = await transcribe(outputMP3FilePath);

							// send the transcription to the channel
							interaction.channel.send(`[${formattedTime}] ${userNameOfSpeaker}: ${text}`);

							// check for Hey ChatGPT
							if (text.includes("Hey ChatGPT")) {
								// get text including and after Hey ChatGPT
								const chatGPTMessage = text.substring(text.indexOf("Hey ChatGPT") + 11);

								const gptReply = await heyChatGPT(chatGPTMessage);
								interaction.channel.send(`[${new Date().toLocaleTimeString()}] ChatGPT: ${gptReply}`);
							}

							// Delete the .pcm and .mp3 files
							const files = [recordingFilePath, outputMP3FilePath];
							for (const file of files) {
								fs.unlink(file, function (err) {
									if (err) {
										console.log("Error while deleting the file" + err);
									}
									console.log("Deleted the file" + file);
								});
							}


						});

					} catch (e) {
						log.error(e);
					}
				});
			} else {
				log.info('Subscription already exists for ' + userNameOfSpeaker);
			}
		});
		return connection;
	},
};
