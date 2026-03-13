import type { JSONSchema7 } from 'json-schema';
import type { Extension } from '@codemirror/state';
import type {
  JSONDocument,
  LanguageService,
  TextDocument,
} from 'vscode-json-languageservice';
import { getLanguageService } from 'vscode-json-languageservice';
import { TextDocument as LSPTextDocument } from 'vscode-languageserver-textdocument';
import type { LintSource, Diagnostic as CMDiagnostic } from '@codemirror/lint';
import { linter } from '@codemirror/lint';
import type { CompletionSource, Completion } from '@codemirror/autocomplete';
import {
  autocompletion,
  closeCompletion,
  insertCompletionText,
  snippet,
  startCompletion,
} from '@codemirror/autocomplete';
import type { HoverTooltipSource, TooltipView } from '@codemirror/view';
import { hoverTooltip, EditorView } from '@codemirror/view';
import { css, spacing } from '@mongodb-js/compass-components';
import { json } from '@codemirror/lang-json';

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

// The URI we use for the schema
const SCHEMA_URI = 'inmemory://json-schema.json';

// The URI we use for the current document being edited
const DOCUMENT_URI = 'file:///json-schema-document.json';

// Shared tooltip styles for hover and lint tooltips
const tooltipStyles = {
  padding: spacing[200],
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

/**
 * Cache for parsed JSON documents to avoid re-parsing on every keystroke.
 * Keyed by content string since TextDocument instances are created fresh each time.
 * Only caches the last document since we operate on a single editor.
 */
let lastDocContent: string | null = null;
let lastJsonDoc: JSONDocument | null = null;

/**
 * Gets a cached JSON document from a text document, parsing it if necessary.
 */
function getJsonDocument(
  languageService: LanguageService,
  document: TextDocument
): JSONDocument {
  const content = document.getText();
  if (lastDocContent === content && lastJsonDoc) {
    return lastJsonDoc;
  }
  lastJsonDoc = languageService.parseJSONDocument(document);
  lastDocContent = content;
  return lastJsonDoc;
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
  // Map common kinds using the numeric values
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

/**
 * Creates a CodeMirror Extension that provides JSON schema-based
 * autocompletion, validation, and hover tooltips using vscode-json-languageservice.
 *
 * This provides full JSON Schema support including allOf/oneOf/anyOf,
 * which is the same engine Monaco/VS Code uses.
 *
 * Dependencies (unified, remark-parse, remark-rehype, rehype-stringify) are
 * dynamically imported because they are ESM-only packages and cannot be
 * statically imported in a CommonJS context.
 *
 * @returns A Promise that resolves to the Extension for the given schema
 */
export async function createJsonSchemaServiceExtension(
  schema: JSONSchema7
): Promise<Extension> {
  // Dynamically import ESM-only dependencies (remark/rehype ecosystem)
  const [{ unified }, remarkParse, remarkRehype, rehypeStringify] =
    await Promise.all([
      import('unified'),
      import('remark-parse'),
      import('remark-rehype'),
      import('rehype-stringify'),
    ]);

  // Create markdown parser using remark for rendering hover tooltips
  const markdownParser = unified()
    .use(remarkParse.default)
    .use(remarkRehype.default, {
      handlers: {
        // Custom handler for links to add target="_blank" and rel="noopener noreferrer"
        link(state: unknown, node: { url: string; title?: string }) {
          const result: import('hast').Element = {
            type: 'element',
            tagName: 'a',
            properties: {
              href: node.url,
              target: '_blank',
              rel: 'noopener noreferrer',
              ...(node.title ? { title: node.title } : {}),
            },
            children: (
              state as { all: (n: unknown) => import('hast').ElementContent[] }
            ).all(node),
          };
          return result;
        },
      },
    })
    .use(rehypeStringify.default);

  const languageService = createJsonLanguageService(schema);

  // Helper to create a TextDocument from content
  const createTextDoc = (content: string): TextDocument => {
    return LSPTextDocument.create(DOCUMENT_URI, 'json', 0, content);
  };

  // Create lint source for validation
  const lintSource: LintSource = async (view) => {
    const content = view.state.doc.toString();
    const textDoc = createTextDoc(content);
    const jsonDocument = getJsonDocument(languageService, textDoc);
    const diagnostics = await languageService.doValidation(
      textDoc,
      jsonDocument
    );

    const results: CMDiagnostic[] = [];
    for (const diagnostic of diagnostics) {
      const { message, range, severity } = diagnostic;

      const from = textDoc.offsetAt(range.start);
      const to = textDoc.offsetAt(range.end);

      results.push({
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
      });
    }

    return results;
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
    const jsonDocument = getJsonDocument(languageService, textDoc);

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
      const { detail, documentation, kind, label, textEdit, insertText } = item;

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
    // The labels from vscode-json-languageservice are property names without quotes
    // (e.g., "name" not "\"name\""), so we should NOT include any leading quote
    // in the 'from' position. This ensures CodeMirror filters based on the
    // word characters only.
    const word = context.matchBefore(/[\w$]*$/);
    const from = word ? word.from : context.pos;

    return {
      from,
      options,
      // Allow filtering to continue working as user types
      validFor: /^[\w$]*$/,
    };
  };

  // Create hover tooltip source
  const hoverSource: HoverTooltipSource = async (view, pos) => {
    const content = view.state.doc.toString();
    const textDoc = createTextDoc(content);
    const jsonDocument = getJsonDocument(languageService, textDoc);

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

    // Check what character was just typed
    update.changes.iterChanges((_fromA, _toA, _fromB, _toB, inserted) => {
      const insertedText = inserted.toString();

      // Trigger completion after typing these characters in JSON:
      // " - starting a property name or string value (may be "" due to auto-pairing)
      // : - after a property name, suggesting values
      // newline - on a new line, suggest properties (may include auto-indent spaces)
      const shouldTrigger =
        insertedText.startsWith('"') ||
        insertedText === ':' ||
        insertedText.startsWith('\n');

      if (shouldTrigger) {
        startCompletion(update.view);
      }
    });
  });

  // Return all extensions bundled together
  return [
    json(),
    linter(lintSource),
    tooltipTheme,
    triggerCompletionOnType,
    autocompletion({
      override: [completionSource],
      activateOnTyping: true,
    }),
    hoverTooltip(hoverSource),
  ];
}
