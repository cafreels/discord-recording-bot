# discord-transcription-bot
A Discord bot that uses slash commands to transcribe voice chats using OpenAI's Whisper!

### Commands
* /record #voice-channel - start a recording
* /stop - stop the recording and auto-generate a .mp3 file

### Dependencies
* ffmpeg
* OpenAI API

## Configuration
Create a config.js file in the root directory copy from the config.example.js file and fill in the values.
* discordAPIKey: Discord Application's token ([Discord Developer Portal](https://discord.com/developers/applications) > "Bot" > "Token")
* botUserID: Discord Application's id ([Discord Developer Portal](https://discord.com/developers/applications) > "General Information" > application id)
* openai_api_key: [https://platform.openai.com/account/api-keys](https://platform.openai.com/account/api-keys)
