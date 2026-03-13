import type { JSONSchema7 } from 'json-schema';
import type { Extension } from '@codemirror/state';
import type {
  JSONDocument,
  LanguageService,
  TextDocument,
  LanguageServiceParams,
} from 'vscode-json-languageservice';
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
import MarkdownIt from 'markdown-it';
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

const markdownParser = new MarkdownIt();

// Override link renderer to open links in new tab
const defaultLinkRender =
  markdownParser.renderer.rules.link_open ||
  function (tokens, idx, options, _env, self) {
    return self.renderToken(tokens, idx, options);
  };

markdownParser.renderer.rules.link_open = function (
  tokens,
  idx,
  options,
  env,
  self
) {
  tokens[idx].attrSet('target', '_blank');
  tokens[idx].attrSet('rel', 'noopener noreferrer');
  return defaultLinkRender(tokens, idx, options, env, self);
};

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
 * Normalizes relaxed JSON (with unquoted property keys) to strict JSON
 * by adding double quotes around unquoted property keys.
 * This allows vscode-json-languageservice to parse and provide completions
 * for documents with unquoted keys.
 *
 * Uses a character-by-character scanner to properly handle:
 * - String contents (including escape sequences)
 * - Single-line comments
 * - Multi-line comments
 *
 * @returns An object with the normalized content and functions to map positions
 */
export function normalizeRelaxedJson(content: string): {
  normalized: string;
  mapPosition: (pos: number) => number;
  mapPositionBack: (pos: number) => number;
} {
  // Track position adjustments caused by adding quotes
  const adjustments: {
    originalPos: number;
    normalizedPos: number;
    keyLength: number;
  }[] = [];

  let result = '';
  let i = 0;

  // State tracking
  let inString = false;
  let stringChar = ''; // '"' or "'"
  let inSingleLineComment = false;
  let inMultiLineComment = false;

  // Helper to check if character at position is an identifier start
  const isIdentifierStart = (char: string): boolean => /[a-zA-Z_$]/.test(char);

  // Helper to check if character is an identifier continuation
  const isIdentifierChar = (char: string): boolean =>
    /[a-zA-Z0-9_$]/.test(char);

  // Helper to check if character is whitespace
  const isWhitespace = (char: string): boolean => /\s/.test(char);

  while (i < content.length) {
    const char = content[i];
    const nextChar = i + 1 < content.length ? content[i + 1] : '';

    // Handle single-line comment content
    if (inSingleLineComment) {
      result += char;
      if (char === '\n') {
        inSingleLineComment = false;
      }
      i++;
      continue;
    }

    // Handle multi-line comment content
    if (inMultiLineComment) {
      result += char;
      if (char === '*' && nextChar === '/') {
        result += nextChar;
        i += 2;
        inMultiLineComment = false;
      } else {
        i++;
      }
      continue;
    }

    // Handle string content
    if (inString) {
      result += char;
      if (char === '\\' && i + 1 < content.length) {
        // Handle escape sequence - copy the escaped character too
        result += content[i + 1];
        i += 2;
      } else if (char === stringChar) {
        // End of string
        inString = false;
        i++;
      } else {
        i++;
      }
      continue;
    }

    // Check for start of string
    if (char === '"' || char === "'") {
      inString = true;
      stringChar = char;
      result += char;
      i++;
      continue;
    }

    // Check for start of single-line comment
    if (char === '/' && nextChar === '/') {
      inSingleLineComment = true;
      result += char;
      i++;
      continue;
    }

    // Check for start of multi-line comment
    if (char === '/' && nextChar === '*') {
      inMultiLineComment = true;
      result += char + nextChar;
      i += 2;
      continue;
    }

    // Check for potential unquoted key (after { or ,)
    if (char === '{' || char === ',') {
      result += char;
      i++;

      // Consume and copy whitespace
      while (i < content.length && isWhitespace(content[i])) {
        result += content[i];
        i++;
      }

      // Check if we're at end or closing brace (empty object or trailing comma)
      if (i >= content.length || content[i] === '}') {
        continue;
      }

      // Check if already quoted - will be handled by string logic in next iteration
      if (content[i] === '"' || content[i] === "'") {
        continue;
      }

      // Check if this looks like a comment start
      if (content[i] === '/' && i + 1 < content.length) {
        const nc = content[i + 1];
        if (nc === '/' || nc === '*') {
          continue; // Will be handled by comment logic in next iteration
        }
      }

      // Try to match unquoted identifier
      if (isIdentifierStart(content[i])) {
        // Find the end of the identifier
        let keyEnd = i;
        while (keyEnd < content.length && isIdentifierChar(content[keyEnd])) {
          keyEnd++;
        }
        const key = content.slice(i, keyEnd);

        // Skip whitespace after identifier
        let j = keyEnd;
        while (j < content.length && isWhitespace(content[j])) {
          j++;
        }

        // Check if followed by colon - this confirms it's a property key
        if (j < content.length && content[j] === ':') {
          // This is an unquoted property key! Quote it.
          const originalKeyStart = i;
          const normalizedKeyStart = result.length + 1; // +1 for the opening quote

          adjustments.push({
            originalPos: originalKeyStart,
            normalizedPos: normalizedKeyStart,
            keyLength: key.length,
          });

          result += '"' + key + '"';
          i = keyEnd;
          continue;
        }
      }

      // Not an unquoted key, continue normal processing
      continue;
    }

    // Normal character - just copy it
    result += char;
    i++;
  }

  // Function to map a position in the original content to the normalized content
  const mapPosition = (originalPos: number): number => {
    let delta = 0;
    for (const adj of adjustments) {
      if (originalPos > adj.originalPos) {
        // Position is after this adjustment point
        delta += 2; // Include the 2 chars we added
      } else if (originalPos === adj.originalPos) {
        // Position is exactly at the start of a key that got quoted
        // Map it to after the opening quote
        delta += 1;
        break;
      } else {
        break;
      }
    }
    return originalPos + delta;
  };

  // Function to map a position from normalized content back to original content
  const mapPositionBack = (normalizedPos: number): number => {
    let delta = 0;
    for (const adj of adjustments) {
      const normalizedKeyEnd = adj.normalizedPos + adj.keyLength;
      // Check if position is within the quoted key region in normalized content
      // The quoted key in normalized: " + key + "
      // adj.normalizedPos points to the key start (after opening quote)
      const quotedStart = adj.normalizedPos - 1; // opening quote position
      const closingQuotePos = normalizedKeyEnd; // position of closing quote

      if (normalizedPos <= quotedStart) {
        // Before this key's opening quote
        break;
      } else if (normalizedPos < normalizedKeyEnd) {
        // Inside the key itself (between quotes) - account for opening quote only
        delta += 1;
        break;
      } else if (normalizedPos === closingQuotePos) {
        // At the closing quote position - account for opening quote only
        delta += 1;
        break;
      } else {
        // After the closing quote - account for both quotes
        delta += 2;
      }
    }
    return normalizedPos - delta;
  };

  return { normalized: result, mapPosition, mapPositionBack };
}

/**
 * Creates a JSON language service configured with the provided schema.
 * Takes getLanguageService as a parameter to support dynamic imports.
 */
function createJsonLanguageService(
  schema: JSONSchema7,
  getLanguageService: (params: LanguageServiceParams) => LanguageService
): LanguageService {
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
 * Dependencies (vscode-json-languageservice, vscode-languageserver-textdocument) are
 * dynamically imported to enable code-splitting - they're only loaded when jsonSchema
 * is actually provided to the editor.
 *
 * @returns A Promise that resolves to a function that creates the extension for a given schema
 */
export async function createJsonSchemaServiceExtension(): Promise<
  (schema: JSONSchema7) => Extension
> {
  // Dynamically import heavy dependencies for code-splitting
  const [{ getLanguageService }, { TextDocument: LSPTextDocument }] =
    await Promise.all([
      import('vscode-json-languageservice'),
      import('vscode-languageserver-textdocument'),
    ]);

  // Return a function that creates extensions for a specific schema
  return (schema: JSONSchema7): Extension => {
    const languageService = createJsonLanguageService(
      schema,
      getLanguageService
    );

    // Helper to create a TextDocument from content
    const createTextDoc = (content: string): TextDocument => {
      return LSPTextDocument.create(DOCUMENT_URI, 'json', 0, content);
    };

    // Create lint source for validation
    const lintSource: LintSource = async (view) => {
      const content = view.state.doc.toString();

      // Normalize relaxed JSON (unquoted keys) to strict JSON for validation
      const { normalized, mapPositionBack } = normalizeRelaxedJson(content);
      const normalizedTextDoc = createTextDoc(normalized);
      const jsonDocument = getJsonDocument(languageService, normalizedTextDoc);
      const diagnostics = await languageService.doValidation(
        normalizedTextDoc,
        jsonDocument
      );

      const results: CMDiagnostic[] = [];
      for (const diagnostic of diagnostics) {
        const { message, range, severity } = diagnostic;

        // Calculate offsets in the normalized document using LSP TextDocument's offsetAt
        // This correctly handles line/character positions in the normalized content
        const normalizedFrom = normalizedTextDoc.offsetAt(range.start);
        const normalizedTo = normalizedTextDoc.offsetAt(range.end);

        // Map positions back to original content
        const from = mapPositionBack(normalizedFrom);
        const to = mapPositionBack(normalizedTo);

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

      // Normalize relaxed JSON (unquoted keys) to strict JSON for the language service
      const { normalized, mapPosition } = normalizeRelaxedJson(content);
      const normalizedTextDoc = createTextDoc(normalized);
      const jsonDocument = getJsonDocument(languageService, normalizedTextDoc);

      // Calculate LSP position in the normalized content
      const line = context.state.doc.lineAt(context.pos);
      const lineStart = line.from;

      // Map the position to the normalized content
      const normalizedPos = mapPosition(context.pos);
      const normalizedLineStart = mapPosition(lineStart);
      const normalizedCharacter = normalizedPos - normalizedLineStart;

      const position = {
        line: line.number - 1,
        character: normalizedCharacter,
      };

      const completions = await languageService.doComplete(
        normalizedTextDoc,
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
          // The textEdit range is in the normalized content, but we need to apply
          // it to the original content. For property key completions, we use
          // the current cursor position as the insertion point.
          const insert = textEdit.newText;
          const insertTextFormat = item.insertTextFormat;

          completion.apply = (view) => {
            // Find what the user has typed so far (for filtering)
            const currentContent = view.state.doc.toString();
            const cursorPos = view.state.selection.main.head;

            // Look back to find the start of what user is typing
            let from = cursorPos;
            const textBefore = currentContent.slice(0, cursorPos);

            // Check if we're completing a property key (after { or ,)
            const propertyKeyMatch = textBefore.match(
              /[{,]\s*"?([a-zA-Z_$][a-zA-Z0-9_$]*)?$/
            );
            if (propertyKeyMatch) {
              // Find start of the partial key (including any opening quote)
              const matchStart = cursorPos - (propertyKeyMatch[1]?.length || 0);
              const hasQuote = textBefore[matchStart - 1] === '"';
              from = hasQuote ? matchStart - 1 : matchStart;
            } else {
              // Check if we're completing a value (after :)
              // This handles cases like typing 't' after ':' to get 'true'
              const valueMatch = textBefore.match(
                /:\s*"?([a-zA-Z_$][a-zA-Z0-9_$]*)?$/
              );
              if (valueMatch) {
                const matchStart = cursorPos - (valueMatch[1]?.length || 0);
                const hasQuote = textBefore[matchStart - 1] === '"';
                from = hasQuote ? matchStart - 1 : matchStart;
              }
            }

            // Check if there's an auto-paired closing quote right after the cursor.
            // If so, remove it since the completion from the language service already
            // includes proper quoting/structure.
            let to = cursorPos;
            const charAfterCursor = view.state.sliceDoc(
              cursorPos,
              cursorPos + 1
            );
            if (charAfterCursor === '"' || charAfterCursor === "'") {
              to = cursorPos + 1;
            }

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

      // Normalize relaxed JSON (unquoted keys) to strict JSON for the language service
      const { normalized, mapPosition, mapPositionBack } =
        normalizeRelaxedJson(content);
      const normalizedTextDoc = createTextDoc(normalized);
      const jsonDocument = getJsonDocument(languageService, normalizedTextDoc);

      // Calculate LSP position in the normalized content
      const line = view.state.doc.lineAt(pos);
      const lineStart = line.from;

      // Map the position to the normalized content
      const normalizedPos = mapPosition(pos);
      const normalizedLineStart = mapPosition(lineStart);
      const normalizedCharacter = normalizedPos - normalizedLineStart;

      const position = {
        line: line.number - 1,
        character: normalizedCharacter,
      };

      const hover = await languageService.doHover(
        normalizedTextDoc,
        position,
        jsonDocument
      );

      if (!hover || !hover.contents) {
        return null;
      }

      let start = pos;
      let end: number | undefined;

      if (hover.range) {
        // Calculate offsets in the normalized document using LSP TextDocument's offsetAt
        // This correctly handles line/character positions in the normalized content
        const normalizedStart = normalizedTextDoc.offsetAt(hover.range.start);
        const normalizedEnd = normalizedTextDoc.offsetAt(hover.range.end);
        start = mapPositionBack(normalizedStart);
        end = mapPositionBack(normalizedEnd);
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
          div.innerHTML = markdownParser.renderInline(hoverText);
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
      update.changes.iterChanges((_fromA, _toA, fromB, _toB, inserted) => {
        const insertedText = inserted.toString();

        // Trigger completion after typing these characters in JSON:
        // " - starting a property name or string value (may be "" due to auto-pairing)
        // : - after a property name, suggesting values
        // newline - on a new line, suggest properties (may include auto-indent spaces)
        let shouldTrigger =
          insertedText.startsWith('"') ||
          insertedText === ':' ||
          insertedText.startsWith('\n');

        // Check if we're starting an unquoted property key (letter after { or ,)
        if (!shouldTrigger && /^[a-zA-Z_$]$/.test(insertedText)) {
          // Look at the text before this character to see if we're in a position
          // where a property key could start (after { or , with only whitespace)
          const textBefore = update.state.sliceDoc(0, fromB);
          const trimmed = textBefore.trimEnd();
          if (trimmed.endsWith('{') || trimmed.endsWith(',')) {
            shouldTrigger = true;
          }
        }

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
  };
}
