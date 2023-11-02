import v8 from 'v8';

type SerializedError = { $$error: Error & { statusCode?: number } };

function pickSerializeableProperties(o: any) {
  return Object.fromEntries(
    Object.getOwnPropertyNames(o)
      .map((p) => {
        try {
          // If we can't serialize something, it will mess up with the error we
          // get on another side, ignore those properties
          v8.serialize(o[p]);
          return [p, o[p]];
        } catch {
          return false;
        }
      })
      .filter((p): p is [string, any] => {
        return !!p;
      })
  );
}

// We are serializing errors to get a better error shape on the other end, ipc
// will only preserve message from the original error. See
// https://github.com/electron/electron/issues/24427
export function serializeErrorForIpc(err: any): SerializedError {
  return {
    $$error: {
      // We serialize all the own properties as properties for the Error and then
      // cherry-pick name, message and stack, since those are properties that we
      // want to have even if they are not own props.
      ...pickSerializeableProperties(err),
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
  };
}

export function deserializeErrorFromIpc({ $$error: err }: SerializedError) {
  const { message, ...rest } = err;
  const e = new Error(message);

  Object.assign(e, rest);
  return e;
}

export function isSerializedError(err: any): err is { $$error: Error } {
  return err !== null && typeof err === 'object' && !!err.$$error;
}
