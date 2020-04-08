
const Config = require('./config.json');
const Async = require('async');
const { WebClient } = require('@slack/web-api');
const Web = new WebClient(Config.oauth_token);

let inline_info = (msg) => {

	let reset = "\x1b[0m";
	let cyan = "\x1b[36m";

	process.stdout.clearLine();
  	process.stdout.cursorTo(0);
	process.stdout.write(`${cyan}${msg}${reset}`);
};

if ( process.argv.length < 3 ) {
	console.error('Missing #channel name')
	process.exit(1)
}

let ChannelName = process.argv[2];

inline_info('starting');

let ch_id = null;

Async.series([

	(cb) => {
		(async () => {
			
			let conversations = [];
			try {
				conversations = await Web.conversations.list();
			} catch(e) {
				return cb(e);
			}

			conversations.channels.forEach((ch) => {
				if ( ch.name == ChannelName ) {

					inline_info(`Found channel ${ch.id}`);

					ch_id = ch.id;
				}
			});

			cb();
		})()
	},

	(cb) => {

		if ( !ch_id ) return cb();

		// 100 at a time by default
		let process_next_batch = async () => {

			let history = null;
			try {
				history = await Web.conversations.history({channel:ch_id});
			} catch(e) {
				return cb(e);
			}

			if ( history.messages.length <= 0 ) return cb();

			inline_info(`Deleting ${history.messages.length} messages`);

			let delete_next_message = async () => {

				if ( history.messages.length <= 0 ) {
					inline_info(`Starting Next Batch`);
					return process_next_batch();
				}

				let message = history.messages.pop();

				inline_info(`Deleting Message ${message.ts}`);

				try {
					await Web.chat.delete({channel: ch_id, ts: message.ts});
				} catch(e) {
					return cb(e);
				}

				// throttle, allowed 50 per minute, lets do 45
				setTimeout(delete_next_message, (1000 * 60) / 45);
			};

			delete_next_message();
		};

		process_next_batch();
	}

], (err) => {

	if (err) {

		console.error(err);

	} else {
		
		inline_info(`Done`);

		console.log("\n") // create new line to pad terminal buffer
	}
});