import { parse } from '@mongodb-js/shell-bson-parser';
import { EJSON } from 'bson';

delete (globalThis as any).require;
delete (globalThis as any).process;

globalThis.onmessage = (evt) => {
  // TODO: assert `evt.data`
  const { requestId, source, ...options } = evt.data;
  try {
    const parsed = parse(source, options);
    if (!parsed || typeof parsed !== 'object') {
      // XXX(COMPASS-5689): We've hit the condition in
      // https://github.com/mongodb-js/ejson-shell-parser/blob/c9c0145ababae52536ccd2244ac2ad01a4bbdef3/src/index.ts#L36
      throw new Error('The provided definition is invalid.');
    }
    postMessage({ requestId, result: EJSON.serialize(parsed) });
  } catch (error) {
    postMessage({ requestId, error });
  }
};
