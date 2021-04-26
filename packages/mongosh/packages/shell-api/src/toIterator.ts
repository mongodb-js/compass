import {
  CommonErrors,
  MongoshInvalidInputError
} from '@mongosh/errors';
class Iterator {
  iterable: AsyncIterable<any> | Iterable<any>;

  constructor(iterable: AsyncIterable<any> | Iterable<any>) {
    this.iterable = iterable;
    if (!Array.isArray(iterable) && !(Symbol.iterator in iterable) && !(Symbol.asyncIterator in iterable)) {
      throw new MongoshInvalidInputError(
        'Calling custom forEach method may not work as expected because callback is async. Try converting to array type before calling forEach.',
        CommonErrors.InvalidArgument
      );
    }
    const proxy = new Proxy(this, {
      get: (obj, prop) => {
        if ((prop in obj)) {
          return (obj as any)[prop];
        }
        return (this.iterable as any)[prop];
      }
    });
    return proxy;
  }

  async forEach(func: (...args: any[]) => void | Promise<void>, thisArg?: any) {
    let i = 0;
    for await (const value of this.iterable) {
      await func.call(thisArg, value, i++, this.iterable);
    }
  }
}

export default (iterable: AsyncIterable<any> | Iterable<any>) => {
  return new Iterator(iterable);
};
