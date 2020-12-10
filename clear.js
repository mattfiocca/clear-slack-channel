// Slack rate limits
// conversations.list: 		20 requests per minute
// conversations.history: 	50 requests per minute
// chat.delete: 			50 requests per minute

const Config = require('./config.json')
const Async = require('async')
const { WebClient } = require('@slack/web-api')
const Web = new WebClient(Config.oauth_token)

const COLOR_RESET = "\x1b[0m"
const COLOR_CYAN = "\x1b[36m"

const inline_info = (msg) => {
	process.stdout.clearLine()
  	process.stdout.cursorTo(0)
	process.stdout.write(`${COLOR_CYAN}${msg}${COLOR_RESET}`)
}

if ( process.argv.length < 3 ) {
	console.error('Not enough arguments')
	process.exit(1)
}

let [ bin, script, ChannelName ] = process.argv

console.log("") // pad terminal one line

inline_info('Starting')

let ch_id = null

Async.series([

	(cb) => {

		(async () => {
			
			let conversations = []
			try {
				conversations = await Web.conversations.list()
			} catch(e) {
				return cb(e)
			}

			let f = conversations.channels.filter((ch) => ch.name == ChannelName)
			if ( f.length <= 0 ) {
				return cb('Channel not found')
			}

			ch_id = f[0].id
			inline_info(`Found #${ChannelName} (${ch_id})`)

			cb()
		})()
	},

	(cb) => {

		// 100 at a time by default
		let process_next_batch = async () => {

			let history = null
			try {
				history = await Web.conversations.history({channel:ch_id})
			} catch(e) {
				return cb(e)
			}

			// done
			if ( history.messages.length <= 0 ) return cb()

			inline_info(`Deleting next batch of ${history.messages.length} messages`)

			let delete_next_message = async () => {

				if ( history.messages.length <= 0 ) return process_next_batch()

				let message = history.messages.shift()

				inline_info(`Deleting Message ${message.ts}`)

				try {
					await Web.chat.delete({channel: ch_id, ts: message.ts})
				} catch(e) {
					return cb(e)
				}

				// throttle, allowed 50 per minute, lets do 45
				setTimeout(delete_next_message, (1000 * 60) / 45)
			}

			delete_next_message()
		}

		process_next_batch()
	}

], (err) => {

	if (err) return console.error(err)

	inline_info(`Done`)

	console.log("\n") // pad terminal one line
})