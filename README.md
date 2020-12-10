# clear-slack-channel
A nodejs tool for clearing all messages in a Slack channel

## Installation
- Setup an OAuth token for your own Slack app. [Read More](https://api.slack.com/authentication/oauth-v2)
- Create a `config.json` file in the same directory as `clear.js` containing your token:
```json
{
	"oauth_token": "xoxp-[YOUR_AUTH_TOKEN]"
}
```
- `npm install` to install modules

## Run
To run the command:
```
node clear channel-name
```

## Notes
This tool is sensitive to Slack's rate limits:
```
conversations.list = 20 requests per minute
conversations.history = 50 requests per minute
chat.delete = 50 requests per minute
```