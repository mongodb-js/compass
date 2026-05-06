import { expect } from 'chai';
import { languages } from '../editor';
import { EditorView } from '@codemirror/view';
import {
  getAncestryOfToken,
  mapMongoDBCompletionToCodemirrorCompletion,
  resolveTokenAtCursor,
} from './utils';
import { CompletionContext } from '@codemirror/autocomplete';

const parseDocument = (_doc = '') => {
  const pos = _doc.indexOf('${}');
  const doc = _doc.replace('${}', '');
  const editor = new EditorView({
    doc,
    extensions: languages['javascript-expression'](),
  });
  const context = new CompletionContext(editor.state, pos, false);
  const token = resolveTokenAtCursor(context);
  return { token, document: context.state.sliceDoc(0) };
};

describe('codemirror utils', function () {
  describe('getAncestryOfToken', function () {
    const useCases = {
      'simple object': {
        doc: '{ a: ${} }',
        expected: ['a'],
      },
      'nested object': {
        doc: '{ "a": { "b": ${} } }',
        expected: ['a', 'b'],
      },
      'nested with array and object': {
        doc: '{ a: { b: [1, 2, { c: ${} }] } }',
        expected: ['a', 'b', '[2]', 'c'],
      },
      'property in no quotes': {
        doc: '{ nam${} }',
        expected: [],
      },
      'property in single quotes': {
        doc: "{ $jsonSchema: { 'nam'${} } }",
        expected: ['$jsonSchema'],
      },
      'property in double quotes': {
        doc: "{ $jsonSchema: { properties: { 'nam'${} } } }",
        expected: ['$jsonSchema', 'properties'],
      },
      'numeric value as a property name': {
        doc: '{ name: { address: { 123${} } } }',
        expected: ['name', 'address'],
      },

      'boolean value as a property name': {
        doc: '{ name: { address: { true${} } } }',
        expected: ['name', 'address'],
      },

      'value in an object': {
        doc: '{ name: nam${} }',
        expected: ['name'],
      },
      'string value in an object': {
        doc: '{ name: "nam"${} }',
        expected: ['name'],
      },
    };
    for (const [name, { doc, expected }] of Object.entries(useCases)) {
      it(`get ancestry - ${name}`, function () {
        const { token, document } = parseDocument(doc);
        const ancestry = getAncestryOfToken(token, document);
        expect(ancestry).to.deep.equal(expected);
      });
    }
  });

  describe('mapMongoDBCompletionToCodemirrorCompletion', function () {
    it('creates a codemirror completion from mongodb constant description', function () {
      const comp = mapMongoDBCompletionToCodemirrorCompletion({
        value: '$comp',
        version: '1.2.3',
        meta: 'bson',
      });
      expect(comp).to.have.property('label', '$comp');
      expect(comp).to.have.property('apply', '$comp');
      expect(comp).to.have.property('detail', 'bson');
    });
    it('creates a description wrapper if mongodb constant description has one', function () {
      const comp1 = mapMongoDBCompletionToCodemirrorCompletion({
        value: '$comp1',
        version: '1.2.3',
        meta: 'bson',
        description: 'This is a description 1',
      });
      expect(comp1).to.have.property('info');
      expect((comp1.info as () => Element)?.().outerHTML).to.eq(
        '<div class="completion-info">This is a description 1</div>'
      );
      const comp2 = mapMongoDBCompletionToCodemirrorCompletion({
        value: '$comp2',
        version: '1.2.3',
        meta: 'bson',
      });
      expect(comp2).to.have.property('info');
      expect((comp2.info as () => null)?.()).to.eq(null);
    });
  });
});
