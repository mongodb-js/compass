// `stream` resolves to readable-stream here, which ships a working
// promises API under the same name.
import stream from 'node:stream';

export const { pipeline, finished } = stream.promises;
