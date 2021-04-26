import util from 'util';
import {expect} from 'chai';

const delay = util.promisify(setTimeout);
export const ensureMaster = async(cls, timeout, hp): Promise<void> => {
  while (!(await cls.isMaster()).ismaster) {
    if (timeout > 32000) {
      return expect.fail(`Waited for ${hp} to become master, never happened`);
    }
    await delay(timeout);
    timeout *= 2; // try again but wait double
  }
};

const localSessionIds = async(mongo) => {
  return (await (await mongo.getDB('config').aggregate([{ $listLocalSessions: {} }])).toArray()).map(k => JSON.stringify(k._id.id));
};

export const ensureSessionExists = async(mongo, timeout, sessionId): Promise<void> => {
  let ls = await localSessionIds(mongo);
  while (!ls.includes(sessionId)) {
    if (timeout > 32000) {
      throw new Error(`Waited for session id ${sessionId}, never happened ${ls}`);
    }
    await delay(timeout);
    timeout *= 2; // try again but wait double
    ls = await localSessionIds(mongo);
  }
};

export const ensureResult = async(timeout, getFn, testFn, failMsg): Promise<any> => {
  let result = await getFn();
  while(!testFn(result)) {
    if (timeout > 1000) {
      console.log(`looping at timeout=${timeout}, result=${result}`);
    }
    if (timeout > 30000) {
      throw new Error(`Waited for ${failMsg}, never happened`);
    }
    await delay(timeout);
    timeout *= 2; // try again but wait double
    result = await getFn();
  }
  return result;
};

