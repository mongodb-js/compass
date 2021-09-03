import { MongoLogWriter, mongoLogId } from 'mongodb-log-writer';
import { Writable } from 'stream';

function createLogger(component: string): {
	log: ReturnType<MongoLogWriter['bindComponent']>,
	mongoLogId: typeof mongoLogId
} {
	// hadron-ipc only works inside of Electron, hence the conditional
	let ipc: typeof import('hadron-ipc') | undefined;
	try {
		ipc = require('hadron-ipc');
	} catch {}

	const target = new Writable({
		decodeStrings: false,
		write(line: string, encoding: unknown, callback: () => void) {
			if (ipc) {
				ipc.call('compass:log', { line });
			} else {
				(process as any).emit('compass:log', { line });
			}
			callback();
		}
	});
  const writer = new MongoLogWriter('', null, target);
  return {
		log: writer.bindComponent(component),
		mongoLogId
	};
}

export = createLogger;
