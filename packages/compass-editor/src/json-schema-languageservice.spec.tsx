import React from 'react';
import {
  render,
  waitFor,
  cleanup,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { CodemirrorMultilineEditor } from './editor';
import type { EditorRef } from './types';
import { expect } from 'chai';
import type { JSONSchema7 } from 'json-schema';
import { normalizeRelaxedJson } from './json-schema-languageservice';

// Simple JSON schema for testing
const testSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description: 'The name of the item',
    },
    count: {
      type: 'number',
      description: 'The count value',
    },
    active: {
      type: 'boolean',
    },
  },
  required: ['name'],
  additionalProperties: false,
};

// Schema with oneOf for testing complex schema support
const oneOfSchema: JSONSchema7 = {
  type: 'object',
  oneOf: [
    {
      properties: {
        type: { const: 'text' },
        analyzer: { type: 'string' },
      },
      required: ['type'],
    },
    {
      properties: {
        type: { const: 'number' },
        representation: { type: 'string' },
      },
      required: ['type'],
    },
  ],
};

/**
 * Helper to render editor with schema and wait for validation callback.
 * Uses onValidationChange for deterministic waiting instead of setTimeout.
 */
function renderEditorWithSchemaAndWaitForValidation(
  schema: JSONSchema7,
  initialText = '{}',
  expectedHasErrors?: boolean
): {
  editorRef: React.RefObject<EditorRef>;
  waitForValidation: () => Promise<boolean>;
} {
  const editorRef = React.createRef<EditorRef>();
  let resolveValidation: ((hasErrors: boolean) => void) | null = null;
  const validationPromise = new Promise<boolean>((resolve) => {
    resolveValidation = resolve;
  });

  const onValidationChange = (hasErrors: boolean) => {
    // If expectedHasErrors is specified, only resolve when we get that state
    // This handles cases where validation fires multiple times
    if (expectedHasErrors === undefined || hasErrors === expectedHasErrors) {
      if (resolveValidation) {
        resolveValidation(hasErrors);
        resolveValidation = null;
      }
    }
  };

  render(
    <CodemirrorMultilineEditor
      text={initialText}
      ref={editorRef}
      jsonSchema={schema}
      onValidationChange={onValidationChange}
      /* eslint-disable-next-line jsx-a11y/no-autofocus */
      autoFocus
    />
  );

  return {
    editorRef,
    waitForValidation: () => validationPromise,
  };
}

describe('json-schema-languageservice', function () {
  afterEach(function () {
    cleanup();
  });

  describe('validation', function () {
    it('shows no errors for valid JSON matching schema', async function () {
      const validJson = '{"name": "test", "count": 42}';
      const { editorRef, waitForValidation } =
        renderEditorWithSchemaAndWaitForValidation(
          testSchema,
          validJson,
          false
        );

      await waitFor(() => {
        expect(editorRef.current?.editor).to.exist;
      });

      const hasErrors = await waitForValidation();
      expect(hasErrors).to.equal(false);

      const errorMarkers = document.querySelectorAll('.cm-lintRange-error');
      expect(errorMarkers.length).to.equal(0);
    });

    it('shows diagnostic for invalid JSON (missing required field)', async function () {
      const invalidJson = '{"count": 42}'; // missing required 'name'
      const editorRef = React.createRef<EditorRef>();

      render(
        <CodemirrorMultilineEditor
          text={invalidJson}
          ref={editorRef}
          jsonSchema={testSchema}
          /* eslint-disable-next-line jsx-a11y/no-autofocus */
          autoFocus
        />
      );

      await waitFor(() => {
        expect(editorRef.current?.editor).to.exist;
      });

      // Wait for lint markers (may be error or warning depending on schema service)
      await waitFor(() => {
        const lintMarkers = document.querySelectorAll(
          '.cm-lintRange-error, .cm-lintRange-warning'
        );
        expect(lintMarkers.length).to.be.greaterThan(0);
      });
    });

    it('shows diagnostic for type mismatch', async function () {
      const invalidJson = '{"name": 123}'; // name should be string, not number
      const editorRef = React.createRef<EditorRef>();

      render(
        <CodemirrorMultilineEditor
          text={invalidJson}
          ref={editorRef}
          jsonSchema={testSchema}
          /* eslint-disable-next-line jsx-a11y/no-autofocus */
          autoFocus
        />
      );

      await waitFor(() => {
        expect(editorRef.current?.editor).to.exist;
      });

      await waitFor(() => {
        const lintMarkers = document.querySelectorAll(
          '.cm-lintRange-error, .cm-lintRange-warning'
        );
        expect(lintMarkers.length).to.be.greaterThan(0);
      });
    });

    it('shows diagnostic for additional properties when not allowed', async function () {
      const invalidJson = '{"name": "test", "unknown": true}';
      const editorRef = React.createRef<EditorRef>();

      render(
        <CodemirrorMultilineEditor
          text={invalidJson}
          ref={editorRef}
          jsonSchema={testSchema}
          /* eslint-disable-next-line jsx-a11y/no-autofocus */
          autoFocus
        />
      );

      await waitFor(() => {
        expect(editorRef.current?.editor).to.exist;
      });

      await waitFor(() => {
        const lintMarkers = document.querySelectorAll(
          '.cm-lintRange-error, .cm-lintRange-warning'
        );
        expect(lintMarkers.length).to.be.greaterThan(0);
      });
    });
  });

  describe('autocompletion', function () {
    it('provides property completions inside object', async function () {
      const { editorRef, waitForValidation } =
        renderEditorWithSchemaAndWaitForValidation(testSchema, '{}');

      await waitFor(() => {
        expect(editorRef.current?.editor).to.exist;
      });

      await waitForValidation();

      // Position cursor inside the object and trigger typing
      editorRef.current?.focus();

      // Move cursor after the opening brace
      userEvent.keyboard('{arrowright}');

      // Type a quote to trigger completion
      userEvent.keyboard('"');

      // Wait for autocompletion popup (deterministic DOM check)
      await waitFor(() => {
        const completionList = document.querySelector(
          '.cm-tooltip-autocomplete'
        );
        expect(completionList).to.exist;
      });

      // Check that property names from schema are suggested
      const completionOptions = document.querySelectorAll(
        '.cm-tooltip-autocomplete .cm-completionLabel'
      );
      const labels = Array.from(completionOptions).map((el) => el.textContent);

      expect(labels).to.include('name');
      expect(labels).to.include('count');
      expect(labels).to.include('active');
    });
  });

  describe('oneOf schema support', function () {
    it('validates against oneOf alternatives', async function () {
      const validJson = '{"type": "text", "analyzer": "standard"}';
      const { editorRef, waitForValidation } =
        renderEditorWithSchemaAndWaitForValidation(
          oneOfSchema,
          validJson,
          false
        );

      await waitFor(() => {
        expect(editorRef.current?.editor).to.exist;
      });

      const hasErrors = await waitForValidation();
      expect(hasErrors).to.equal(false);

      const errorMarkers = document.querySelectorAll('.cm-lintRange-error');
      expect(errorMarkers.length).to.equal(0);
    });
  });

  describe('onValidationChange callback', function () {
    it('fires callback when validation state changes', async function () {
      const validationStates: boolean[] = [];
      let resolveFirstValidation: (() => void) | null = null;
      const firstValidationPromise = new Promise<void>((resolve) => {
        resolveFirstValidation = resolve;
      });

      const onValidationChange = (hasErrors: boolean) => {
        validationStates.push(hasErrors);
        if (resolveFirstValidation) {
          resolveFirstValidation();
          resolveFirstValidation = null;
        }
      };

      const editorRef = React.createRef<EditorRef>();
      render(
        <CodemirrorMultilineEditor
          text='{"name": "test"}'
          ref={editorRef}
          jsonSchema={testSchema}
          onValidationChange={onValidationChange}
          /* eslint-disable-next-line jsx-a11y/no-autofocus */
          autoFocus
        />
      );

      await waitFor(() => {
        expect(editorRef.current?.editor).to.exist;
      });

      await firstValidationPromise;

      // The initial valid JSON should result in hasErrors: false being called
      expect(validationStates).to.include(false);
    });
  });

  describe('normalizeRelaxedJson', function () {
    it('returns unchanged content for already valid JSON', function () {
      const content = '{"name": "test", "count": 42}';
      const { normalized } = normalizeRelaxedJson(content);
      expect(normalized).to.equal(content);
    });

    it('adds quotes around single unquoted property key', function () {
      const content = '{ name: "test" }';
      const { normalized } = normalizeRelaxedJson(content);
      expect(normalized).to.equal('{ "name": "test" }');
    });

    it('adds quotes around multiple unquoted property keys', function () {
      const content = '{ name: "test", count: 42 }';
      const { normalized } = normalizeRelaxedJson(content);
      expect(normalized).to.equal('{ "name": "test", "count": 42 }');
    });

    it('handles nested objects with unquoted keys', function () {
      const content = '{ outer: { inner: "value" } }';
      const { normalized } = normalizeRelaxedJson(content);
      expect(normalized).to.equal('{ "outer": { "inner": "value" } }');
    });

    it('handles mixed quoted and unquoted keys', function () {
      const content = '{ name: "test", "count": 42, active: true }';
      const { normalized } = normalizeRelaxedJson(content);
      expect(normalized).to.equal(
        '{ "name": "test", "count": 42, "active": true }'
      );
    });

    it('handles keys with underscores and dollars', function () {
      const content = '{ _private: 1, $special: 2, normal_key: 3 }';
      const { normalized } = normalizeRelaxedJson(content);
      expect(normalized).to.equal(
        '{ "_private": 1, "$special": 2, "normal_key": 3 }'
      );
    });

    describe('string handling', function () {
      it('does not modify content inside double-quoted strings', function () {
        const content = '{ name: "a, foo: b" }';
        const { normalized } = normalizeRelaxedJson(content);
        // 'foo:' inside the string should NOT be quoted
        expect(normalized).to.equal('{ "name": "a, foo: b" }');
      });

      it('does not modify content inside single-quoted strings', function () {
        const content = "{ name: 'a, foo: b' }";
        const { normalized } = normalizeRelaxedJson(content);
        expect(normalized).to.equal('{ "name": \'a, foo: b\' }');
      });

      it('handles escaped quotes inside strings', function () {
        const content = '{ name: "test \\" , foo: bar" }';
        const { normalized } = normalizeRelaxedJson(content);
        // The escaped quote should not end the string, so 'foo:' stays inside
        expect(normalized).to.equal('{ "name": "test \\" , foo: bar" }');
      });

      it('handles escaped backslashes inside strings', function () {
        const content = '{ path: "C:\\\\Users\\\\test", name: "value" }';
        const { normalized } = normalizeRelaxedJson(content);
        expect(normalized).to.equal(
          '{ "path": "C:\\\\Users\\\\test", "name": "value" }'
        );
      });

      it('handles colons in string values (URLs)', function () {
        const content = '{ url: "http://example.com:8080" }';
        const { normalized } = normalizeRelaxedJson(content);
        expect(normalized).to.equal('{ "url": "http://example.com:8080" }');
      });

      it('handles empty strings', function () {
        const content = '{ empty: "", name: "test" }';
        const { normalized } = normalizeRelaxedJson(content);
        expect(normalized).to.equal('{ "empty": "", "name": "test" }');
      });
    });

    describe('comment handling', function () {
      it('does not modify content inside single-line comments', function () {
        const content = '{ name: "test" // foo: bar\n}';
        const { normalized } = normalizeRelaxedJson(content);
        expect(normalized).to.equal('{ "name": "test" // foo: bar\n}');
      });

      it('does not modify content inside multi-line comments', function () {
        const content = '{ name: "test" /* foo: bar */ }';
        const { normalized } = normalizeRelaxedJson(content);
        expect(normalized).to.equal('{ "name": "test" /* foo: bar */ }');
      });

      it('does not treat comment markers inside strings as comments', function () {
        const content = '{ comment: "// not a comment, foo: bar" }';
        const { normalized } = normalizeRelaxedJson(content);
        expect(normalized).to.equal(
          '{ "comment": "// not a comment, foo: bar" }'
        );
      });
    });

    describe('edge cases', function () {
      it('handles empty objects', function () {
        const content = '{}';
        const { normalized } = normalizeRelaxedJson(content);
        expect(normalized).to.equal('{}');
      });

      it('handles objects with only whitespace', function () {
        const content = '{  }';
        const { normalized } = normalizeRelaxedJson(content);
        expect(normalized).to.equal('{  }');
      });

      it('handles trailing commas', function () {
        const content = '{ name: "test", }';
        const { normalized } = normalizeRelaxedJson(content);
        expect(normalized).to.equal('{ "name": "test", }');
      });

      it('handles whitespace before colons', function () {
        const content = '{ name : "test" }';
        const { normalized } = normalizeRelaxedJson(content);
        expect(normalized).to.equal('{ "name" : "test" }');
      });

      it('handles no whitespace around keys', function () {
        const content = '{name:"test"}';
        const { normalized } = normalizeRelaxedJson(content);
        expect(normalized).to.equal('{"name":"test"}');
      });

      it('handles arrays containing objects', function () {
        const content = '[{ foo: 1 }, { bar: 2 }]';
        const { normalized } = normalizeRelaxedJson(content);
        expect(normalized).to.equal('[{ "foo": 1 }, { "bar": 2 }]');
      });

      it('does not quote numeric keys', function () {
        // Numeric keys are not valid identifiers, leave them as-is
        const content = '{ 123: "value" }';
        const { normalized } = normalizeRelaxedJson(content);
        expect(normalized).to.equal('{ 123: "value" }');
      });

      it('handles deeply nested structures', function () {
        const content = '{ a: { b: { c: { d: 1 } } } }';
        const { normalized } = normalizeRelaxedJson(content);
        expect(normalized).to.equal('{ "a": { "b": { "c": { "d": 1 } } } }');
      });

      it('handles newlines and multiline content', function () {
        const content = '{\n  name: "test",\n  count: 42\n}';
        const { normalized } = normalizeRelaxedJson(content);
        expect(normalized).to.equal('{\n  "name": "test",\n  "count": 42\n}');
      });

      it('handles keys that look like keywords', function () {
        const content = '{ true: 1, false: 2, null: 3 }';
        const { normalized } = normalizeRelaxedJson(content);
        expect(normalized).to.equal('{ "true": 1, "false": 2, "null": 3 }');
      });
    });

    describe('mapPosition (original to normalized)', function () {
      it('maps position before any keys unchanged', function () {
        const content = '{ foo: 1 }';
        const { mapPosition } = normalizeRelaxedJson(content);
        // Position 0 is before everything
        expect(mapPosition(0)).to.equal(0);
        // Position 1 is at the space after {
        expect(mapPosition(1)).to.equal(1);
      });

      it('maps position at key start to after opening quote', function () {
        const content = '{ foo: 1 }';
        const { mapPosition } = normalizeRelaxedJson(content);
        // 'foo' starts at position 2 in original
        // In normalized '{ "foo": 1 }', 'foo' starts at position 3 (after ")
        expect(mapPosition(2)).to.equal(3);
      });

      it('maps position after key to account for added quotes', function () {
        const content = '{ foo: 1 }';
        const { mapPosition } = normalizeRelaxedJson(content);
        // Position after 'foo:' in original is 6
        // In normalized, it's 6 + 2 = 8 (for the two quotes added)
        expect(mapPosition(6)).to.equal(8);
      });

      it('maps positions correctly with multiple keys', function () {
        const content = '{ a: 1, b: 2 }';
        const { mapPosition } = normalizeRelaxedJson(content);
        // 'a' at pos 2 -> pos 3 (after first ")
        expect(mapPosition(2)).to.equal(3);
        // 'b' at pos 8 in original -> pos 8 + 2 (for "a") + 1 = 11 in normalized
        expect(mapPosition(8)).to.equal(11);
      });
    });

    describe('mapPositionBack (normalized to original)', function () {
      it('maps position before any keys unchanged', function () {
        const content = '{ foo: 1 }';
        const { mapPositionBack } = normalizeRelaxedJson(content);
        expect(mapPositionBack(0)).to.equal(0);
        expect(mapPositionBack(1)).to.equal(1);
      });

      it('maps position inside quoted key back to original key position', function () {
        const content = '{ foo: 1 }';
        const { mapPositionBack } = normalizeRelaxedJson(content);
        // In normalized '{ "foo": 1 }', 'f' is at position 3
        // In original '{ foo: 1 }', 'f' is at position 2
        expect(mapPositionBack(3)).to.equal(2);
      });

      it('maps position after quoted key back correctly', function () {
        const content = '{ foo: 1 }';
        const { mapPositionBack } = normalizeRelaxedJson(content);
        // Original:   '{ foo: 1 }' - ':' is at position 5
        //              0123456789
        // Normalized: '{ "foo": 1 }' - ':' is at position 7
        //              012345678901
        expect(mapPositionBack(7)).to.equal(5);
      });

      it('maps positions correctly with multiple keys', function () {
        const content = '{ a: 1, b: 2 }';
        const { mapPositionBack } = normalizeRelaxedJson(content);
        // Normalized: '{ "a": 1, "b": 2 }'
        // 'a' in normalized is at pos 3, in original at pos 2
        expect(mapPositionBack(3)).to.equal(2);
        // 'b' in normalized is at pos 11, in original at pos 8
        expect(mapPositionBack(11)).to.equal(8);
      });
    });
  });
});
