const crypto = require('crypto');
const EventEmitter = require('events');

class Socket extends EventEmitter {
	constructor(rawSocket) {
		super();

		this.rawSend = rawSocket.send.bind(this);
		rawSocket.on('message', this.handleMessage.bind(this));

		this.timeout = 50;
		this.pending = {};
	}

 	send(msg, ...args) {
		const id = crypto.randomBytes(32);

		const rawMsg = Buffer.concat([
			Buffer.alloc(1, 0),
			id,
			Buffer.from(msg)
		]);

		const sendMessage = () => this.rawSend(rawMsg, ...args);

		this.pending[id.toString('hex')] = setInterval(sendMessage, this.timeout);
	}

	handleMessage(rawMsg, { port, address }) {
		const cmd = rawMsg[0];
		const id = rawMsg.slice(1, 33);
		const msg = rawMsg.slice(33);

		// send ack
		if(cmd === 0) {
			const reply = Buffer.concat([
				Buffer.alloc(1, 1),
				id
			]);

			this.rawSend(rawMsg, port, address);
		}

		// recieved ack
		if(cmd === 1) {
			this.clearInterval(this.pending[id.toString('hex')]);
		}
	}
}
