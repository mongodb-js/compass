import React, { useState } from 'react';
import { render, waitFor, cleanup } from '@mongodb-js/testing-library-compass';
import { CodemirrorMultilineEditor } from './editor';
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
  onValidationComplete,
  onAnnotationsChange,
}: {
  schema: JSONSchema7;
  initialText: string;
  editorRef: React.RefObject<EditorRef>;
  onExtensionsLoaded?: () => void;
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
  }, [extensions, completer, onExtensionsLoaded]);

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
  afterEach(function () {
    cleanup();
  });

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
