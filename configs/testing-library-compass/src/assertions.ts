import { Assertion, util } from 'chai';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace Chai {
    interface Assertion {
      /** Asserts that a dialog is open */
      get open(): Assertion;
      /** Asserts that a dialog is closed */
      get closed(): Assertion;
    }
  }
}

util.addProperty(
  Assertion.prototype,
  'open',
  function (this: typeof Assertion) {
    const obj = util.flag(this, 'object');
    new Assertion(obj).to.be.instanceof(HTMLDialogElement);
    new Assertion(obj as HTMLDialogElement).has.property(
      'open',
      true,
      'Expected dialog to be open'
    );
  }
);

util.addProperty(
  Assertion.prototype,
  'closed',
  function (this: typeof Assertion) {
    const obj = util.flag(this, 'object');
    new Assertion(obj).to.be.instanceof(HTMLDialogElement);
    new Assertion(obj as HTMLDialogElement).has.property(
      'open',
      false,
      'Expected dialog to be closed'
    );
  }
);
