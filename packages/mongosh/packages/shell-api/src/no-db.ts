import { MongoshInvalidInputError } from '@mongosh/errors';
import { ShellApiErrors } from './error-codes';
import Mongo from './mongo';

export default class NoDatabase {
  _mongo: Mongo;
  constructor() {
    this._mongo = new NoMongo() as Mongo;
    const proxy = new Proxy(this, {
      get: (_target, prop): any => {
        if (prop === '_mongo') return this._mongo; // so we can create rs/sh without erroring
        throw new MongoshInvalidInputError('No connected database', ShellApiErrors.NotConnected);
      }
    });
    return proxy;
  }
}

class NoMongo {
  constructor() {
    const proxy = new Proxy(this, {
      get: (): any => {
        throw new MongoshInvalidInputError('No connected database', ShellApiErrors.NotConnected);
      }
    });
    return proxy;
  }
}
