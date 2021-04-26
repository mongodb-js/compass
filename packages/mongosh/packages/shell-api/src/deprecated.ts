import {
  ShellApiClass,
  shellApiClassDefault,
  classDeprecated
} from './decorators';
import { asPrintable } from './enums';
import { MongoshDeprecatedError } from '@mongosh/errors';


@shellApiClassDefault
@classDeprecated
class DeprecatedClass extends ShellApiClass {
  public name: string;
  constructor(name: string, alternatives: Record<string, string> = {}) {
    super();
    this.name = name;
    const proxy = new Proxy(this, {
      get: (obj, prop): any => {
        if (typeof prop === 'string' && !(prop in obj)) {
          const alt = alternatives[prop] || '';
          throw new MongoshDeprecatedError(`The class ${name} is deprecated.${alt}`);
        }
        return (obj as any)[prop];
      }
    });
    return proxy;
  }

  /**
   * Internal method to determine what is printed for this class.
   */
  [asPrintable](): string {
    return `The class ${this.name} is deprecated`;
  }
}

export class DBQuery extends DeprecatedClass {
  constructor() {
    super('DBQuery', {
      shellBatchSize: ' Please use \'batchSize\' on the cursor instead: db.coll.find().batchSize(<size>)'
    });
  }
}
