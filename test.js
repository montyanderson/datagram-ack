const assert = require('assert');
const crypto = require('crypto');
const dgram = require('dgram');
const Socket = require('./');

const rawSocket = dgram.createSocket('udp4');
const socket = new Socket(rawSocket);
const port = 3200;
rawSocket.bind(3200);

const helper = dgram.createSocket('udp4');

test('should recieve ack and emit message event', async () => {
	const id = crypto.randomBytes(32);

	const message = crypto.randomBytes(Math.floor(Math.random() * 100) + 10);

	const rawMsg = Buffer.concat([
		Buffer.alloc(1, 0),
		id,
		message
	]);

	helper.send(rawMsg, port);

	await Promise.all([
		(async () => {
			const rawAck = await new Promise(resolve => helper.once('message', resolve));

			assert.equal(rawAck.length, 33);
			assert.equal(rawAck[0], 1);
			assert.deepEqual(rawAck.slice(1, 33), id);
		})(),
		(async () => {
			const reportedMessage = await new Promise(resolve => socket.once('message', resolve));

			assert.deepEqual(message, reportedMessage);
		})()
	])

});
