import { EditorView } from '@codemirror/view';
import { EditorState, EditorSelection } from '@codemirror/state';
import type {
  CompletionSource,
  CompletionResult,
} from '@codemirror/autocomplete';
import { CompletionContext } from '@codemirror/autocomplete';
import { expect } from 'chai';
// import { languages } from '../json-editor';
import { createQueryAutocompleter } from './query-autocompleter';

const setupCompleter = <T extends (...args: any[]) => CompletionSource>(
  completer: T
) => {
  const el = window.document.createElement('div');
  window.document.body.appendChild(el);
  const editor = new EditorView({
    state: EditorState.create({
      doc: '',
    }),
    selection: EditorSelection.single(0),
    // TODO: doesn't look like extensions work when inside jsdom. need to sort
    // it out to be able to better test completers
    // extensions: [languages.javascript()],
    parent: el,
  });
  const getCompletions = (text = '', ...args: Parameters<T>) => {
    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: text },
      selection: { anchor: text.length },
      userEvent: 'input.type',
    });
    return (
      (
        completer(...args)(
          new CompletionContext(editor.state, text.length, false)
        ) as CompletionResult
      )?.options ?? []
    );
  };
  const cleanup = () => {
    editor.destroy();
    el.remove();
  };
  return { getCompletions, cleanup };
};

describe('query autocompleter', function () {
  const { getCompletions, cleanup } = setupCompleter(createQueryAutocompleter);

  after(cleanup);

  it('returns all completions when current token is vaguely matches identifier', function () {
    expect(getCompletions('foo')).to.have.lengthOf(45);
  });

  it("doesn't return anything when not matching identifier", function () {
    expect(getCompletions('[')).to.have.lengthOf(0);
  });

  // See above, need extensions to actually work for this
  it.skip('completes "any text" when inside a string', function () {
    expect(
      getCompletions('{ bar: 1, buz: 2, foo: "b').map(
        (completion) => completion.label
      )
    ).to.deep.eq(2);
  });

  it('escapes field names that are not valid identifiers', function () {
    expect(
      getCompletions('{ $m', {
        fields: [
          'field name with spaces',
          'dots.and+what@not',
          'quotes"in"quotes',
        ],
      })
        .filter((completion) => completion.detail?.startsWith('field'))
        .map((completion) => completion.apply)
    ).to.deep.eq([
      '"field name with spaces"',
      '"dots.and+what@not"',
      '"quotes\\"in\\"quotes"',
    ]);
  });
});
