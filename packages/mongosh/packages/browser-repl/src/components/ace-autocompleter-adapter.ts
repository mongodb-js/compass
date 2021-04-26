import { Autocompleter, Completion } from '@mongosh/browser-runtime-core';

interface AceCompletion {
  caption: string;
  value: string;
}

/**
 * @private
 *
 * Adapts an Autocompleter instance to comply with the ACE Editor
 * interface.
 */
export class AceAutocompleterAdapter {
  private adaptee: Autocompleter;

  constructor(adaptee: Autocompleter) {
    this.adaptee = adaptee;
  }

  getCompletions = (
    _editor: any,
    session: any,
    position: { row: number; column: number },
    prefix: string,
    done: (err: Error | null, completions?: AceCompletion[]) => any): void => {
    // ACE wont include '.' in the prefix, so we have to extract a new prefix
    // including dots to be passed to the autocompleter.
    const line = session.getLine(position.row)
      .substring(0, position.column);

    this.adaptee.getCompletions(line)
      .then((completions) => {
        done(null, completions.map(
          this.adaptCompletion.bind(this, prefix, line)
        ));
      })
      .catch(done);
  };

  adaptCompletion = (prefix: string, line: string, completion: Completion): AceCompletion => {
    // We convert the completion to the ACE editor format by taking only
    // the last part. ie (db.coll1.find -> find)
    const value = prefix + completion.completion.substring(line.length);
    return {
      caption: value,
      value: value
    };
  };
}
