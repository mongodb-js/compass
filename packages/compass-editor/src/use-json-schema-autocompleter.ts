import { useState, useEffect, useMemo, useRef } from 'react';
import type { JSONSchema7 } from 'json-schema';
import type { Extension } from '@codemirror/state';
import type {
  JSONDocument,
  LanguageService,
  TextDocument,
} from 'vscode-json-languageservice';
import { getLanguageService } from 'vscode-json-languageservice';
import { TextDocument as LSPTextDocument } from 'vscode-languageserver-textdocument';
import type { CompletionSource, Completion } from '@codemirror/autocomplete';
import {
  closeCompletion,
  insertCompletionText,
  snippet,
  startCompletion,
} from '@codemirror/autocomplete';
import type { HoverTooltipSource, TooltipView } from '@codemirror/view';
import { hoverTooltip, EditorView } from '@codemirror/view';
import { css, spacing } from '@mongodb-js/compass-components';
import type { Annotation } from './editor';
import type { Element, ElementContent, Root } from 'hast';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';

// The URI we use for the schema
const SCHEMA_URI = 'inmemory://json-schema.json';

// The URI we use for the current document being edited
const DOCUMENT_URI = 'file:///json-schema-document.json';

// Create markdown parser using remark for rendering hover tooltips
const markdownParser = unified()
  .use(remarkParse)
  .use(remarkRehype, {
    handlers: {
      // Custom handler for links to add target="_blank" and rel="noopener noreferrer"
      link(state: unknown, node: { url: string; title?: string }) {
        const result: Element = {
          type: 'element',
          tagName: 'a',
          properties: {
            href: node.url,
            target: '_blank',
            rel: 'noopener noreferrer',
            ...(node.title ? { title: node.title } : {}),
          },
          children: (
            state as {
              all: (n: unknown) => ElementContent[];
            }
          ).all(node),
        };
        return result;
      },
    },
  })
  .use(() => {
    // Custom rehype plugin to unwrap paragraph tags (render inline without <p>)
    return (tree: Root) => {
      tree.children = tree.children.flatMap((node) =>
        node.type === 'element' && node.tagName === 'p' ? node.children : [node]
      );
    };
  })
  .use(rehypeSanitize)
  .use(rehypeStringify);

// Shared tooltip styles for hover and lint tooltips
const tooltipStyles = {
  padding: `${spacing[200]}px`,
  maxWidth: '300px',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
};

const hoverTooltipStyles = css(tooltipStyles);

// Theme extension to style tooltips - override fixed height on parent container
const tooltipTheme = EditorView.theme({
  '.cm-tooltip-hover': {
    height: 'auto !important',
  },
  '.cm-tooltip-lint': tooltipStyles,
});

// CompletionItemKind and InsertTextFormat are numeric enums in LSP
// Values from https://microsoft.github.io/language-server-protocol/specifications/specification-current/
const CompletionItemKindMap = {
  Text: 1,
  Method: 2,
  Function: 3,
  Constructor: 4,
  Field: 5,
  Variable: 6,
  Class: 7,
  Interface: 8,
  Module: 9,
  Property: 10,
  Unit: 11,
  Value: 12,
  Enum: 13,
  Keyword: 14,
  Snippet: 15,
  Color: 16,
  File: 17,
  Reference: 18,
  Folder: 19,
  EnumMember: 20,
  Constant: 21,
  Struct: 22,
} as const;

const InsertTextFormatMap = {
  PlainText: 1,
  Snippet: 2,
} as const;

/**
 * Cache for parsed JSON documents to avoid re-parsing on every keystroke.
 * Each hook instance maintains its own cache via useRef.
 */
interface JsonDocumentCache {
  content: string | null;
  jsonDoc: JSONDocument | null;
}

/**
 * Gets a cached JSON document from a text document, parsing it if necessary.
 */
function getJsonDocument(
  languageService: LanguageService,
  document: TextDocument,
  cache: JsonDocumentCache
): JSONDocument {
  const content = document.getText();
  if (cache.content === content && cache.jsonDoc) {
    return cache.jsonDoc;
  }
  cache.jsonDoc = languageService.parseJSONDocument(document);
  cache.content = content;
  return cache.jsonDoc;
}

/**
 * Creates a JSON language service configured with the provided schema.
 */
function createJsonLanguageService(schema: JSONSchema7): LanguageService {
  const schemaContent = JSON.stringify(schema);

  const languageService = getLanguageService({
    schemaRequestService: (uri: string) => {
      if (uri === SCHEMA_URI) {
        return Promise.resolve(schemaContent);
      }
      return Promise.reject(new Error(`Unable to load schema at ${uri}`));
    },
  });

  languageService.configure({
    allowComments: true,
    schemas: [
      {
        uri: SCHEMA_URI,
        fileMatch: ['*'],
      },
    ],
  });

  return languageService;
}

/**
 * Converts LSP CompletionItemKind to CodeMirror completion type.
 */
function fromCompletionItemKind(kind: number | undefined): string | undefined {
  if (kind === undefined) return undefined;
  switch (kind) {
    case CompletionItemKindMap.Text:
    case CompletionItemKindMap.Snippet:
      return 'text';
    case CompletionItemKindMap.Method:
      return 'method';
    case CompletionItemKindMap.Function:
      return 'function';
    case CompletionItemKindMap.Constructor:
    case CompletionItemKindMap.Class:
      return 'class';
    case CompletionItemKindMap.Field:
    case CompletionItemKindMap.Property:
      return 'property';
    case CompletionItemKindMap.Variable:
    case CompletionItemKindMap.Value:
      return 'variable';
    case CompletionItemKindMap.Interface:
    case CompletionItemKindMap.Struct:
      return 'type';
    case CompletionItemKindMap.Module:
      return 'namespace';
    case CompletionItemKindMap.Enum:
    case CompletionItemKindMap.EnumMember:
      return 'enum';
    case CompletionItemKindMap.Keyword:
      return 'keyword';
    case CompletionItemKindMap.Constant:
      return 'constant';
    default:
      return undefined;
  }
}

export type JsonSchemaAutocompleterResult = {
  /** Completer to pass to the editor's completer prop */
  completer: CompletionSource | undefined;
  /** Extensions to pass to the editor's customExtensions prop (hover tooltips, etc.) */
  extensions: Extension[];
  /** Annotations derived from schema validation */
  annotations: Annotation[];
  /** Whether there are any error-severity validation issues */
  hasErrors: boolean;
};

/**
 * Hook that provides JSON schema-based autocompletion, validation, and hover tooltips.
 *
 * This hook manages the state "above" the editor, following Compass patterns where
 * the parent component owns validation state and provides annotations down to the editor.
 *
 * @param schema - JSON Schema to validate and autocomplete against
 * @param text - Current editor text content (for validation)
 * @returns Object with completer, extensions, annotations, and hasErrors state
 *
 * @example
 * ```tsx
 * const { completer, extensions, annotations, hasErrors } = useJsonSchemaAutocompleter(schema, text);
 * return (
 *   <>
 *     <CodemirrorMultilineEditor
 *       text={text}
 *       completer={completer}
 *       customExtensions={extensions}
 *       annotations={annotations}
 *     />
 *     <Button disabled={hasErrors}>Save</Button>
 *   </>
 * );
 * ```
 */
export function useJsonSchemaAutocompleter(
  schema: JSONSchema7 | undefined,
  text: string
): JsonSchemaAutocompleterResult {
  const [editorConfig, setEditorConfig] = useState<{
    completer: CompletionSource | undefined;
    extensions: Extension[];
  }>({ completer: undefined, extensions: [] });
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  const languageServiceRef = useRef<LanguageService | null>(null);

  // Per-instance cache for parsed JSON documents in case we need to support multiple editors
  const jsonDocCacheRef = useRef<JsonDocumentCache>({
    content: null,
    jsonDoc: null,
  });

  // Load extensions and language service when schema changes
  useEffect(() => {
    if (!schema) {
      setEditorConfig({ completer: undefined, extensions: [] });
      languageServiceRef.current = null;
      return;
    }

    // schema is already checked above in the if(!schema) guard
    const languageService = createJsonLanguageService(schema!);
    languageServiceRef.current = languageService;

    // Capture cache reference for use in closures
    const jsonDocCache = jsonDocCacheRef.current;

    // Helper to create a TextDocument from content
    const createTextDoc = (content: string): TextDocument => {
      return LSPTextDocument.create(DOCUMENT_URI, 'json', 0, content);
    };

    // Create completion source for autocompletion
    const completionSource: CompletionSource = async (context) => {
      // Don't auto-trigger right after comma (user just finished a value)
      if (!context.explicit) {
        const currentLine = context.state.doc.lineAt(context.pos);
        const textBeforeCursor = context.state.sliceDoc(
          currentLine.from,
          context.pos
        );
        if (textBeforeCursor.trimEnd().endsWith(',')) {
          return null;
        }
      }

      const content = context.state.doc.toString();
      const textDoc = createTextDoc(content);
      const jsonDocument = getJsonDocument(
        languageService,
        textDoc,
        jsonDocCache
      );

      // Calculate LSP position
      const line = context.state.doc.lineAt(context.pos);
      const position = {
        line: line.number - 1,
        character: context.pos - line.from,
      };

      const completions = await languageService.doComplete(
        textDoc,
        position,
        jsonDocument
      );

      if (!completions || completions.items.length === 0) {
        return null;
      }

      const options: Completion[] = [];

      for (const item of completions.items) {
        const { detail, documentation, kind, label, textEdit, insertText } =
          item;

        const completion: Completion = {
          label,
          detail,
          type: fromCompletionItemKind(kind),
          info:
            documentation && typeof documentation === 'string'
              ? documentation
              : documentation &&
                typeof documentation === 'object' &&
                'value' in documentation
              ? documentation.value
              : undefined,
        };

        if (textEdit && 'range' in textEdit) {
          const insert = textEdit.newText;
          const insertTextFormat = item.insertTextFormat;
          const from = textDoc.offsetAt(textEdit.range.start);
          const to = textDoc.offsetAt(textEdit.range.end);

          completion.apply = (view) => {
            if (insertTextFormat === InsertTextFormatMap.Snippet) {
              snippet(insert.replaceAll(/\$(\d+)/g, '$${$1}'))(
                view,
                completion,
                from,
                to
              );
            } else {
              view.dispatch(insertCompletionText(view.state, insert, from, to));
            }

            // Close the completion popup to prevent it from re-triggering
            // immediately after applying.
            closeCompletion(view);
          };
        } else if (insertText) {
          completion.apply = insertText;
        }

        options.push(completion);
      }

      // Calculate the 'from' position for filtering.
      const word = context.matchBefore(/[\w$]*$/);
      const from = word ? word.from : context.pos;

      return {
        from,
        options,
        validFor: /^[\w$]*$/,
      };
    };

    // Create hover tooltip source
    const hoverSource: HoverTooltipSource = async (view, pos) => {
      const content = view.state.doc.toString();
      const textDoc = createTextDoc(content);
      const jsonDocument = getJsonDocument(
        languageService,
        textDoc,
        jsonDocCache
      );

      // Calculate LSP position
      const line = view.state.doc.lineAt(pos);
      const position = {
        line: line.number - 1,
        character: pos - line.from,
      };

      const hover = await languageService.doHover(
        textDoc,
        position,
        jsonDocument
      );

      if (!hover || !hover.contents) {
        return null;
      }

      let start = pos;
      let end: number | undefined;

      if (hover.range) {
        start = textDoc.offsetAt(hover.range.start);
        end = textDoc.offsetAt(hover.range.end);
      }

      // Extract the text content from the hover
      let hoverText = '';
      const contents = hover.contents;
      if (typeof contents === 'string') {
        hoverText = contents;
      } else if (Array.isArray(contents)) {
        hoverText = contents
          .map((c) => (typeof c === 'string' ? c : c.value))
          .join('\n\n');
      } else if ('value' in contents) {
        hoverText = contents.value;
      }

      const tooltipView: TooltipView = {
        dom: (() => {
          const div = document.createElement('div');
          div.className = hoverTooltipStyles;
          div.dataset.testid = 'json-schema-hover-tooltip';
          div.innerHTML = String(markdownParser.processSync(hoverText));
          return div;
        })(),
      };

      return {
        pos: start,
        end,
        create: () => tooltipView,
      };
    };

    // Extension to trigger completions on specific JSON characters
    const triggerCompletionOnType = EditorView.updateListener.of((update) => {
      if (!update.docChanged) return;

      update.changes.iterChanges((_fromA, _toA, _fromB, _toB, inserted) => {
        const insertedText = inserted.toString();

        const shouldTrigger =
          insertedText.startsWith('"') ||
          insertedText === ':' ||
          insertedText.startsWith('\n');

        if (shouldTrigger) {
          startCompletion(update.view);
        }
      });
    });

    setEditorConfig({
      completer: completionSource,
      extensions: [
        tooltipTheme,
        triggerCompletionOnType,
        hoverTooltip(hoverSource),
      ],
    });
  }, [schema]);

  // Validate text against schema whenever text or extensions change
  useEffect(() => {
    if (
      !schema ||
      !languageServiceRef.current ||
      editorConfig.extensions.length === 0
    ) {
      setAnnotations([]);
      return;
    }

    let aborted = false;

    async function validate() {
      const languageService = languageServiceRef.current;
      if (!languageService) return;

      const textDoc = LSPTextDocument.create(DOCUMENT_URI, 'json', 0, text);
      const jsonDocument = getJsonDocument(
        languageService,
        textDoc,
        jsonDocCacheRef.current
      );
      const diagnostics = await languageService.doValidation(
        textDoc,
        jsonDocument
      );

      if (aborted) return;

      const results: Annotation[] = diagnostics.map((diagnostic) => {
        const { message, range, severity } = diagnostic;
        const from = textDoc.offsetAt(range.start);
        const to = textDoc.offsetAt(range.end);

        return {
          message,
          from,
          to,
          severity:
            severity === 4
              ? 'hint'
              : severity === 3
              ? 'info'
              : severity === 2
              ? 'warning'
              : 'error',
        };
      });

      setAnnotations(results);
    }

    validate().catch(() => {
      // Ignore validation errors
    });

    return () => {
      aborted = true;
    };
  }, [schema, text, editorConfig.extensions.length]);

  // Compute hasErrors from annotations - both error and warning severity block validation
  // Note: vscode-json-languageservice reports schema violations (missing required fields,
  // type mismatches, etc.) as warnings, so we include them in validation blocking
  const hasErrors = useMemo(() => {
    return annotations.some(
      (a) => a.severity === 'error' || a.severity === 'warning'
    );
  }, [annotations]);

  return {
    completer: editorConfig.completer,
    extensions: editorConfig.extensions,
    annotations,
    hasErrors,
  };
}
