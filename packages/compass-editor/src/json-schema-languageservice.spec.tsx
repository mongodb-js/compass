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
});
