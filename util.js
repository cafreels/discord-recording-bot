const fs = require('fs');
const path = require('path');
const log = require('npmlog');
const _ = require('underscore');
var ffmpeg = require('fluent-ffmpeg');
const config = require('./config.js');
let timeoutTimer = null;

async function createNewRecordingForUser(userId) {
	if (!fs.existsSync('./recordings')) {
		await fs.mkdirSync('./recordings');
	};
	const newFileName = await getNewFileName(userId);
	const pathToFile = __dirname + '/recordings/' + newFileName + '.pcm';
	return fs.createWriteStream(pathToFile);
};

function getNewFileName(userId) {
	const today = new Date();
	const dd = String(today.getDate()).padStart(2, '0');
	const mm = String(today.getMonth() + 1).padStart(2, '0');
	const yyyy = today.getFullYear();

	const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
	const day = weekday[today.getDay()];

	return userId + '_' + mm + '_' + dd + '_' + yyyy + '_' + day + '_' + Date.now();
};

async function convertFile(input, output, callback) {
	const fileToConvert =  input;
	const fileToMake =  output;
	await ffmpeg(fileToConvert).inputOptions('-f','s16le','-ar','48000','-ac','2').output(fileToMake).on('end', function() {
		callback(null);
	}).on('error', function(err){
		callback(err);
	}).run();
};

async function startTimeoutTimer(interaction) {
	timeoutTimer = await setInterval(checkNumberOfVoiceMembers, 3000, interaction);
}

async function stopTimeoutTimer() {
	clearInterval(timeoutTimer);
}

async function checkNumberOfVoiceMembers(interaction) {
	const voiceChannel = await interaction.guild.channels.fetch(interaction.options.getChannel('channel').id, { force: true });
 	if (voiceChannel.members?.size === 1) {
 		log.info('Detected no users in the channel during recording, stopping automatically');
 		await interaction.client.commands.get('stop').execute(interaction);
 	}
}

module.exports = {
	convertFile,
	startTimeoutTimer,
	stopTimeoutTimer,
	createNewRecordingForUser,
};