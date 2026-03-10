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

function renderEditorWithSchema(
  schema: JSONSchema7,
  initialText = '{}'
): { editorRef: React.RefObject<EditorRef> } {
  const editorRef = React.createRef<EditorRef>();
  render(
    <CodemirrorMultilineEditor
      text={initialText}
      ref={editorRef}
      jsonSchema={schema}
      /* eslint-disable-next-line jsx-a11y/no-autofocus */
      autoFocus
    />
  );
  return { editorRef };
}

describe('json-schema-languageservice', function () {
  afterEach(function () {
    cleanup();
  });

  describe('validation', function () {
    it('shows no errors for valid JSON matching schema', async function () {
      const validJson = '{"name": "test", "count": 42}';
      const { editorRef } = renderEditorWithSchema(testSchema, validJson);

      // Wait for the editor to initialize and linting to complete
      await waitFor(
        () => {
          expect(editorRef.current?.editor).to.exist;
        },
        { timeout: 2000 }
      );

      // Wait for linter (300ms delay) and check for no error markers
      await new Promise((resolve) => setTimeout(resolve, 500));

      const errorMarkers = document.querySelectorAll('.cm-lintRange-error');
      expect(errorMarkers.length).to.equal(0);
    });

    it('shows error for invalid JSON (missing required field)', async function () {
      const invalidJson = '{"count": 42}'; // missing required 'name'
      const { editorRef } = renderEditorWithSchema(testSchema, invalidJson);

      await waitFor(
        () => {
          expect(editorRef.current?.editor).to.exist;
        },
        { timeout: 2000 }
      );

      // Wait for linter to run - check for any lint range (error or warning)
      await waitFor(
        () => {
          // vscode-json-languageservice may report missing required as warning
          const lintMarkers = document.querySelectorAll(
            '.cm-lintRange-error, .cm-lintRange-warning'
          );
          expect(lintMarkers.length).to.be.greaterThan(0);
        },
        { timeout: 2000 }
      );
    });

    it('shows error for type mismatch', async function () {
      const invalidJson = '{"name": 123}'; // name should be string, not number
      const { editorRef } = renderEditorWithSchema(testSchema, invalidJson);

      await waitFor(
        () => {
          expect(editorRef.current?.editor).to.exist;
        },
        { timeout: 2000 }
      );

      await waitFor(
        () => {
          const lintMarkers = document.querySelectorAll(
            '.cm-lintRange-error, .cm-lintRange-warning'
          );
          expect(lintMarkers.length).to.be.greaterThan(0);
        },
        { timeout: 2000 }
      );
    });

    it('shows error for additional properties when not allowed', async function () {
      const invalidJson = '{"name": "test", "unknown": true}';
      const { editorRef } = renderEditorWithSchema(testSchema, invalidJson);

      await waitFor(
        () => {
          expect(editorRef.current?.editor).to.exist;
        },
        { timeout: 2000 }
      );

      await waitFor(
        () => {
          const lintMarkers = document.querySelectorAll(
            '.cm-lintRange-error, .cm-lintRange-warning'
          );
          expect(lintMarkers.length).to.be.greaterThan(0);
        },
        { timeout: 2000 }
      );
    });
  });

  describe('autocompletion', function () {
    it('provides property completions inside object', async function () {
      const { editorRef } = renderEditorWithSchema(testSchema, '{}');

      await waitFor(
        () => {
          expect(editorRef.current?.editor).to.exist;
        },
        { timeout: 2000 }
      );

      // Position cursor inside the object and trigger typing
      editorRef.current?.focus();

      // Move cursor after the opening brace
      userEvent.keyboard('{arrowright}');

      // Type a quote to trigger completion
      userEvent.keyboard('"');

      // Wait for autocompletion popup
      await waitFor(
        () => {
          const completionList = document.querySelector(
            '.cm-tooltip-autocomplete'
          );
          expect(completionList).to.exist;
        },
        { timeout: 2000 }
      );

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
      // Valid JSON matching first alternative
      const validJson = '{"type": "text", "analyzer": "standard"}';
      const { editorRef } = renderEditorWithSchema(oneOfSchema, validJson);

      await waitFor(
        () => {
          expect(editorRef.current?.editor).to.exist;
        },
        { timeout: 2000 }
      );

      // Wait for linter
      await new Promise((resolve) => setTimeout(resolve, 500));

      const errorMarkers = document.querySelectorAll('.cm-lintRange-error');
      expect(errorMarkers.length).to.equal(0);
    });
  });

  describe('onValidationChange callback', function () {
    it('fires callback when validation state changes', async function () {
      const validationStates: boolean[] = [];
      const onValidationChange = (hasErrors: boolean) => {
        validationStates.push(hasErrors);
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

      await waitFor(
        () => {
          expect(editorRef.current?.editor).to.exist;
        },
        { timeout: 2000 }
      );

      // Wait for initial validation
      await new Promise((resolve) => setTimeout(resolve, 500));

      // The initial valid JSON should result in hasErrors: false being called
      expect(validationStates).to.include(false);
    });
  });
});
