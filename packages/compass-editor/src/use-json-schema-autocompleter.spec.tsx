import React, { useState } from 'react';
import { render, waitFor } from '@mongodb-js/testing-library-compass';
import { CompletionContext } from '@codemirror/autocomplete';
import type { CompletionSource } from '@codemirror/autocomplete';
import { EditorView } from '@codemirror/view';
import { CodemirrorMultilineEditor, languages } from './editor';
import { useJsonSchemaAutocompleter } from './use-json-schema-autocompleter';
import type { EditorRef } from './types';
import { expect } from 'chai';
import type { JSONSchema7 } from 'json-schema';
import type { Annotation } from './editor';

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

function TestEditorWithSchema({
  schema,
  initialText,
  editorRef,
  onExtensionsLoaded,
  onCompleterReady,
  onValidationComplete,
  onAnnotationsChange,
}: {
  schema: JSONSchema7;
  initialText: string;
  editorRef: React.RefObject<EditorRef>;
  onExtensionsLoaded?: () => void;
  onCompleterReady?: (completer: CompletionSource) => void;
  onValidationComplete?: (hasErrors: boolean) => void;
  onAnnotationsChange?: (annotations: Annotation[]) => void;
}) {
  const [text, setText] = useState(initialText);
  const { completer, extensions, annotations, hasErrors } =
    useJsonSchemaAutocompleter(schema, text);

  // Notify parent when extensions are loaded (completer is also loaded at the same time)
  React.useEffect(() => {
    if (extensions.length > 0 && completer && onExtensionsLoaded) {
      onExtensionsLoaded();
    }
    if (completer && onCompleterReady) {
      onCompleterReady(completer);
    }
  }, [extensions, completer, onExtensionsLoaded, onCompleterReady]);

  // Notify parent when validation completes
  React.useEffect(() => {
    if (onValidationComplete) {
      onValidationComplete(hasErrors);
    }
  }, [hasErrors, onValidationComplete]);

  // Notify parent when annotations change
  React.useEffect(() => {
    if (onAnnotationsChange) {
      onAnnotationsChange(annotations);
    }
  }, [annotations, onAnnotationsChange]);

  return (
    <CodemirrorMultilineEditor
      ref={editorRef}
      language="json"
      text={text}
      onChangeText={setText}
      completer={completer}
      customExtensions={extensions}
      annotations={annotations}
      /* eslint-disable-next-line jsx-a11y/no-autofocus */
      autoFocus
    />
  );
}

describe('useJsonSchemaAutocompleter', function () {
  describe('validation', function () {
    it('returns hasErrors=false for valid JSON matching schema', async function () {
      const validJson = '{"name": "test", "count": 42}';
      const editorRef = React.createRef<EditorRef>();
      let extensionsLoaded = false;
      let capturedHasErrors: boolean | undefined;
      let capturedAnnotations: Annotation[] = [];

      render(
        <TestEditorWithSchema
          schema={testSchema}
          initialText={validJson}
          editorRef={editorRef}
          onExtensionsLoaded={() => {
            extensionsLoaded = true;
          }}
          onValidationComplete={(hasErrors) => {
            capturedHasErrors = hasErrors;
          }}
          onAnnotationsChange={(annotations) => {
            capturedAnnotations = annotations;
          }}
        />
      );

      // Wait for schema validation infrastructure to be ready
      await waitFor(() => {
        expect(extensionsLoaded).to.equal(true);
      });

      // Now verify validation ran and found no issues
      await waitFor(() => {
        expect(capturedHasErrors).to.equal(false);
        expect(capturedAnnotations).to.have.length(0);
      });
    });

    it('returns hasErrors=true for missing required field', async function () {
      const invalidJson = '{"count": 42}'; // missing required 'name'
      const editorRef = React.createRef<EditorRef>();
      let extensionsLoaded = false;
      let capturedHasErrors: boolean | undefined;
      let capturedAnnotations: Annotation[] = [];

      render(
        <TestEditorWithSchema
          schema={testSchema}
          initialText={invalidJson}
          editorRef={editorRef}
          onExtensionsLoaded={() => {
            extensionsLoaded = true;
          }}
          onValidationComplete={(hasErrors) => {
            capturedHasErrors = hasErrors;
          }}
          onAnnotationsChange={(annotations) => {
            capturedAnnotations = annotations;
          }}
        />
      );

      // Wait for schema validation infrastructure to be ready
      await waitFor(() => {
        expect(extensionsLoaded).to.equal(true);
      });

      // Verify validation ran and found errors
      await waitFor(() => {
        expect(capturedHasErrors).to.equal(true);
        expect(capturedAnnotations.length).to.be.greaterThan(0);
      });
    });

    it('returns hasErrors=true for type mismatch', async function () {
      const invalidJson = '{"name": 123}'; // name should be string, not number
      const editorRef = React.createRef<EditorRef>();
      let extensionsLoaded = false;
      let capturedHasErrors: boolean | undefined;
      let capturedAnnotations: Annotation[] = [];

      render(
        <TestEditorWithSchema
          schema={testSchema}
          initialText={invalidJson}
          editorRef={editorRef}
          onExtensionsLoaded={() => {
            extensionsLoaded = true;
          }}
          onValidationComplete={(hasErrors) => {
            capturedHasErrors = hasErrors;
          }}
          onAnnotationsChange={(annotations) => {
            capturedAnnotations = annotations;
          }}
        />
      );

      // Wait for schema validation infrastructure to be ready
      await waitFor(() => {
        expect(extensionsLoaded).to.equal(true);
      });

      // Verify validation ran and found errors
      await waitFor(() => {
        expect(capturedHasErrors).to.equal(true);
        expect(capturedAnnotations.length).to.be.greaterThan(0);
      });
    });

    it('returns hasErrors=true for additional properties when not allowed', async function () {
      const invalidJson = '{"name": "test", "unknown": true}';
      const editorRef = React.createRef<EditorRef>();
      let extensionsLoaded = false;
      let capturedHasErrors: boolean | undefined;
      let capturedAnnotations: Annotation[] = [];

      render(
        <TestEditorWithSchema
          schema={testSchema}
          initialText={invalidJson}
          editorRef={editorRef}
          onExtensionsLoaded={() => {
            extensionsLoaded = true;
          }}
          onValidationComplete={(hasErrors) => {
            capturedHasErrors = hasErrors;
          }}
          onAnnotationsChange={(annotations) => {
            capturedAnnotations = annotations;
          }}
        />
      );

      // Wait for schema validation infrastructure to be ready
      await waitFor(() => {
        expect(extensionsLoaded).to.equal(true);
      });

      // Verify validation ran and found errors
      await waitFor(() => {
        expect(capturedHasErrors).to.equal(true);
        expect(capturedAnnotations.length).to.be.greaterThan(0);
      });
    });
  });

  describe('annotations', function () {
    it('provides annotations that show lint markers in editor', async function () {
      const invalidJson = '{"count": 42}'; // missing required 'name'
      const editorRef = React.createRef<EditorRef>();
      let capturedAnnotations: Annotation[] = [];

      render(
        <TestEditorWithSchema
          schema={testSchema}
          initialText={invalidJson}
          editorRef={editorRef}
          onAnnotationsChange={(annotations) => {
            capturedAnnotations = annotations;
          }}
        />
      );

      await waitFor(() => {
        expect(editorRef.current?.editor).to.exist;
      });

      // Wait for lint markers to appear in the gutter
      await waitFor(() => {
        const lintMarkers = document.querySelectorAll(
          '.cm-lint-marker-error, .cm-lint-marker-warning'
        );
        expect(lintMarkers.length).to.be.greaterThan(0);
      });

      // Check that annotations have correct message
      const hasRequiredError = capturedAnnotations.some(
        (a) =>
          a.message.toLowerCase().includes('required') ||
          a.message.toLowerCase().includes('name')
      );
      expect(hasRequiredError).to.equal(true);
    });

    it('clears annotations when JSON becomes valid', async function () {
      const editorRef = React.createRef<EditorRef>();
      let capturedAnnotations: Annotation[] = [];

      render(
        <TestEditorWithSchema
          schema={testSchema}
          initialText='{"count": 42}'
          editorRef={editorRef}
          onAnnotationsChange={(annotations) => {
            capturedAnnotations = annotations;
          }}
        />
      );

      await waitFor(() => {
        expect(editorRef.current?.editor).to.exist;
      });

      // First verify we have errors
      await waitFor(() => {
        expect(capturedAnnotations.length).to.be.greaterThan(0);
      });

      // Fix the JSON by adding the required field
      const validJson = '{"name": "test", "count": 42}';
      editorRef.current?.editor?.dispatch({
        changes: {
          from: 0,
          to: editorRef.current.editor.state.doc.length,
          insert: validJson,
        },
      });

      // Wait for annotations to clear
      await waitFor(() => {
        expect(capturedAnnotations.length).to.equal(0);
      });
    });
  });

  describe('autocompletion', function () {
    it('loads extensions and completer when schema is provided', async function () {
      const editorRef = React.createRef<EditorRef>();
      let extensionsLoaded = false;

      render(
        <TestEditorWithSchema
          schema={testSchema}
          initialText="{}"
          editorRef={editorRef}
          onExtensionsLoaded={() => {
            extensionsLoaded = true;
          }}
        />
      );

      await waitFor(() => {
        expect(editorRef.current?.editor).to.exist;
      });

      await waitFor(() => {
        expect(extensionsLoaded).to.equal(true);
      });
    });

    // Helper: render the test editor, wait for the completer to be ready,
    // then return the completer function so we can call it directly
    // (bypassing the CodeMirror popup which doesn't render in jsdom).
    async function getCompleterForSchema(schema: JSONSchema7) {
      const editorRef = React.createRef<EditorRef>();
      let capturedCompleter: CompletionSource | undefined;

      render(
        <TestEditorWithSchema
          schema={schema}
          initialText="{}"
          editorRef={editorRef}
          onCompleterReady={(c) => {
            capturedCompleter = c;
          }}
        />
      );

      await waitFor(() => {
        expect(capturedCompleter).to.exist;
      });

      return capturedCompleter!;
    }

    // Helper: create a bare EditorView with JSON language and given text,
    // invoke the completer, and return the result.
    async function getCompletions(
      completer: CompletionSource,
      text: string,
      pos?: number
    ) {
      const el = document.createElement('div');
      document.body.appendChild(el);
      const editor = new EditorView({
        doc: text,
        extensions: [languages['json']()],
        parent: el,
      });
      const cursorPos = pos ?? text.length;
      editor.dispatch({ selection: { anchor: cursorPos } });
      const ctx = new CompletionContext(editor.state, cursorPos, true);
      const result = await completer(ctx);
      return { result, editor, el };
    }

    it('replaces the full typed property prefix when accepting a completion', async function () {
      const completer = await getCompleterForSchema({
        type: 'object',
        properties: { fields: { type: 'object' } },
      });

      // Simulate: user typed {"fie with cursor at end
      const { result, editor, el } = await getCompletions(
        completer,
        '{"fie',
        5
      );

      expect(result).to.exist;
      const fieldsOption = result!.options.find((o) => o.label === 'fields');
      expect(fieldsOption).to.exist;

      // Call apply directly — it should replace from the word start (pos 1)
      // through the cursor (pos 5), producing valid JSON
      if (typeof fieldsOption!.apply === 'function') {
        fieldsOption!.apply(editor, fieldsOption!, result!.from, 5);
      }

      const content = editor.state.sliceDoc(0);
      expect(content).to.include('{"fields": {}');

      editor.destroy();
      el.remove();
    });

    it('does not leave a trailing quote when accepting after typing inside auto-closed quotes', async function () {
      const completer = await getCompleterForSchema({
        type: 'object',
        properties: { fields: { type: 'object' } },
      });

      // Simulate: {"fie"} where cursor is at pos 5 (before the closing quote)
      // This is what happens when closeBrackets auto-inserts the closing "
      const { result, editor, el } = await getCompletions(
        completer,
        '{"fie"}',
        5
      );

      expect(result).to.exist;
      const fieldsOption = result!.options.find((o) => o.label === 'fields');
      expect(fieldsOption).to.exist;

      if (typeof fieldsOption!.apply === 'function') {
        fieldsOption!.apply(editor, fieldsOption!, result!.from, 5);
      }

      // The trailing auto-inserted quote should be swallowed, not duplicated
      const content = editor.state.sliceDoc(0);
      expect(content).to.include('{"fields": {}');

      editor.destroy();
      el.remove();
    });

    it('shows property suggestions when typing a double quote', async function () {
      const completer = await getCompleterForSchema({
        type: 'object',
        properties: { fields: { type: 'object' }, name: { type: 'string' } },
      });

      // Simulate: user typed {" with cursor right after the quote
      const { result, editor, el } = await getCompletions(completer, '{"', 2);

      expect(result).to.exist;
      const labels = result!.options.map((o) => o.label);
      expect(labels).to.include('fields');
      expect(labels).to.include('name');

      editor.destroy();
      el.remove();
    });

    it('filters suggestions using validFor as user types after quote', async function () {
      const completer = await getCompleterForSchema({
        type: 'object',
        properties: { fields: { type: 'object' }, name: { type: 'string' } },
      });

      // Simulate: user typed {"n — should match "name" but not "fields"
      const { result, editor, el } = await getCompletions(completer, '{"n', 3);

      expect(result).to.exist;
      // The validFor regex should allow CodeMirror to filter by the typed prefix "n"
      expect(result!.validFor).to.exist;
      // The options returned by the LSP include both, but validFor lets CM filter
      const labels = result!.options.map((o) => o.label);
      // At minimum the LSP should return options; filtering is done client-side
      expect(labels.length).to.be.greaterThan(0);

      // Verify the validFor regex matches the typed prefix
      const typedText = 'n';
      expect(typedText).to.match(result!.validFor as RegExp);

      editor.destroy();
      el.remove();
    });

    it('matches suggestions that include punctuation like a dot', async function () {
      const completer = await getCompleterForSchema({
        type: 'object',
        properties: {
          'a.b': { type: 'string' },
          ab: { type: 'string' },
        },
      });

      // Simulate: user typed {"a. — the dot should be included in the filter range
      const { result, editor, el } = await getCompletions(completer, '{"a.', 4);

      expect(result).to.exist;
      const labels = result!.options.map((o) => o.label);
      expect(labels).to.include('a.b');

      // The validFor regex should match text containing dots
      expect('a.').to.match(result!.validFor as RegExp);

      editor.destroy();
      el.remove();
    });

    it('strips surrounding quotes from labels so filtering works', async function () {
      const completer = await getCompleterForSchema({
        type: 'object',
        properties: { fields: { type: 'object' } },
      });

      const { result, editor, el } = await getCompletions(completer, '{"', 2);

      expect(result).to.exist;
      // Labels should NOT have surrounding quotes
      for (const option of result!.options) {
        expect(option.label).to.not.match(/^"/);
        expect(option.label).to.not.match(/"$/);
      }

      editor.destroy();
      el.remove();
    });

    it('removes surrounding quotes when accepting a non-string value like a number', async function () {
      const completer = await getCompleterForSchema({
        type: 'object',
        properties: {
          numPartitions: { type: 'number', enum: [1, 2, 4] },
        },
      });

      // Simulate: user typed {"numPartitions": "1" (closeBrackets added closing ")
      // Cursor is after 1, before the closing quote.
      const { result, editor, el } = await getCompletions(
        completer,
        '{"numPartitions": "1"}',
        20 // cursor after '1', before closing '"'
      );

      expect(result).to.exist;
      const opt = result!.options.find((o) => o.label === '1');
      expect(opt).to.exist;

      // Apply should swallow both the preceding and trailing quotes
      if (typeof opt!.apply === 'function') {
        opt!.apply(editor, opt!, result!.from, 20);
      }

      const content = editor.state.sliceDoc(0);
      // Should produce a clean number value without extra quotes
      expect(content).to.include('numPartitions": 1');
      // Should NOT have "1" (quoted) — the value is a number
      expect(content).to.not.match(/"1"/);

      editor.destroy();
      el.remove();
    });
  });

  describe('oneOf schema support', function () {
    it('validates against oneOf alternatives', async function () {
      const validJson = '{"type": "text", "analyzer": "standard"}';
      const editorRef = React.createRef<EditorRef>();
      let extensionsLoaded = false;
      let capturedHasErrors: boolean | undefined;
      let capturedAnnotations: Annotation[] = [];

      render(
        <TestEditorWithSchema
          schema={oneOfSchema}
          initialText={validJson}
          editorRef={editorRef}
          onExtensionsLoaded={() => {
            extensionsLoaded = true;
          }}
          onValidationComplete={(hasErrors) => {
            capturedHasErrors = hasErrors;
          }}
          onAnnotationsChange={(annotations) => {
            capturedAnnotations = annotations;
          }}
        />
      );

      // Wait for schema validation infrastructure to be ready
      await waitFor(() => {
        expect(extensionsLoaded).to.equal(true);
      });

      // Verify validation ran and found no issues
      await waitFor(() => {
        expect(capturedHasErrors).to.equal(false);
        expect(capturedAnnotations).to.have.length(0);
      });
    });
  });

  describe('schema undefined behavior', function () {
    it('returns empty extensions and hasErrors=false when schema is undefined', async function () {
      let capturedExtensions: unknown[] = [];
      let capturedCompleter: unknown = 'not-set';
      let capturedHasErrors: boolean | undefined;

      function TestWrapper() {
        const [text] = useState('{}');
        const { completer, extensions, hasErrors } = useJsonSchemaAutocompleter(
          undefined,
          text
        );

        React.useEffect(() => {
          capturedExtensions = extensions;
          capturedCompleter = completer;
          capturedHasErrors = hasErrors;
        }, [extensions, completer, hasErrors]);

        return <div>Test</div>;
      }

      render(<TestWrapper />);

      await waitFor(() => {
        expect(capturedHasErrors).to.equal(false);
      });

      expect(capturedExtensions).to.deep.equal([]);
      expect(capturedCompleter).to.equal(undefined);
    });
  });

  describe('invalid JSON syntax', function () {
    it('returns hasErrors=true for malformed JSON', async function () {
      const malformedJson = '{"name": }'; // syntax error
      const editorRef = React.createRef<EditorRef>();
      let extensionsLoaded = false;
      let capturedHasErrors: boolean | undefined;
      let capturedAnnotations: Annotation[] = [];

      render(
        <TestEditorWithSchema
          schema={testSchema}
          initialText={malformedJson}
          editorRef={editorRef}
          onExtensionsLoaded={() => {
            extensionsLoaded = true;
          }}
          onValidationComplete={(hasErrors) => {
            capturedHasErrors = hasErrors;
          }}
          onAnnotationsChange={(annotations) => {
            capturedAnnotations = annotations;
          }}
        />
      );

      // Wait for schema validation infrastructure to be ready
      await waitFor(() => {
        expect(extensionsLoaded).to.equal(true);
      });

      // Verify validation ran and found errors
      await waitFor(() => {
        expect(capturedHasErrors).to.equal(true);
        expect(capturedAnnotations.length).to.be.greaterThan(0);
      });
    });
  });
});
