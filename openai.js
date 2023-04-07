const { Configuration, OpenAIApi } = require('openai');
const log = require('npmlog');

const openai_api_key = config.openai_api_key;
if(!openai_api_key) {
    log.error('Missing OpenAI API key');
}

const configuration = new Configuration({
	apiKey: openai_api_key,
});

const openai = new OpenAIApi(configuration);

async function transcribe(filePath) {
	log.info("Transcribing " + filePath);
	const resp = await openai.createTranscription(
		fs.createReadStream(filePath),
		"whisper-1",
		"This is discord voice chat discussion for the Shardeum Discord server. Sometimes a user say 'Hey ChatGPT' to get a response from the bot."
	);
	log.info("Done transcribing " + filePath);
	return resp.data.text;
}

async function heyChatGPT(message) {
	log.info("Asking ChatGPT " + message);
	const completion = await openai.createChatCompletion({
		model: "gpt-3.5-turbo",
		messages: [
			{ role: "system", content: "You are in the Shardeum voice chat responding to transcribed user messages." },
			{ role: "user", content: message },
		],
	});
	return completion.data.choices[0].message.content;
}

module.exports = {
    openai,
    transcribe,
    heyChatGPT,
  };