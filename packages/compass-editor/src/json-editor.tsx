/**
 * TODO: We want to migrate all editors to codemirror from ace, as this involves
 * refactoring a decent amount of code in multiple places in the codebase, we
 * are starting with json editor as the first step because it supports the least
 * amount of functionality that other editors might need. The code in this file
 * should eventually become the new base-editor, when the following
 * functionality is covered:
 *
 * - [x] basic functionality: code highlighting for js and json, controlled /
 *       uncontrolled behavior, gutters, common hotkeys
 * - [x] leafygreen light and dark theme
 * - [x] inline mode (disabled gutter extensions and adjusted theme)
 * - [ ] autocomplete
 * - [x] lint annotations (for agg. builder)
 *
 * https://jira.mongodb.org/browse/COMPASS-6481
 */
import React, { useEffect, useLayoutEffect, useRef } from 'react';
import type { Command } from '@codemirror/view';
import {
  keymap,
  drawSelection,
  highlightActiveLine,
  lineNumbers,
  highlightActiveLineGutter,
  EditorView,
} from '@codemirror/view';
import {
  indentOnInput,
  bracketMatching,
  foldGutter,
  foldKeymap,
  unfoldAll,
  forceParsing,
  syntaxTreeAvailable,
  foldable,
  syntaxTree,
  foldInside,
  foldEffect,
} from '@codemirror/language';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands';
import type { Diagnostic } from '@codemirror/lint';
import { lintGutter, setDiagnosticsEffect } from '@codemirror/lint';
import type { CompletionSource } from '@codemirror/autocomplete';
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
} from '@codemirror/autocomplete';
import {
  css,
  cx,
  fontFamilies,
  palette,
  spacing,
  useDarkMode,
  useEffectOnChange,
  codePalette,
} from '@mongodb-js/compass-components';
import { javascriptLanguage } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import type { Extension } from '@codemirror/state';
import { Facet, Compartment, EditorState } from '@codemirror/state';
import {
  LanguageSupport,
  syntaxHighlighting,
  HighlightStyle,
} from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { rgba } from 'polished';
import { prettify as _prettify } from './prettify';

const editorStyle = css({
  fontSize: 13,
  fontFamily: fontFamilies.code,
});

type CodemirrorThemeType = 'light' | 'dark';

const editorPalette = {
  light: {
    color: codePalette.light[3],
    backgroundColor: codePalette.light[0],
    gutterColor: palette.gray.base,
    gutterBackgroundColor: palette.gray.light3,
    gutterActiveLineBackgroundColor: rgba(palette.gray.light2, 0.5),
    gutterFoldButtonColor: palette.black,
    cursorColor: palette.gray.base,
    // Semi-transparent opacity so that the selection background can still be seen.
    activeLineBackgroundColor: rgba(palette.gray.light2, 0.5),
    selectionBackgroundColor: palette.blue.light2,
    bracketBorderColor: palette.gray.light1,
    infoGutterIconColor: encodeURIComponent(palette.blue.base),
    warningGutterIconColor: encodeURIComponent(palette.yellow.base),
    errorGutterIconColor: encodeURIComponent(palette.red.base),
    foldPlaceholderColor: palette.gray.base,
    foldPlaceholderBackgroundColor: palette.gray.light3,
  },
  dark: {
    color: codePalette.dark[3],
    backgroundColor: codePalette.dark[0],
    gutterColor: palette.gray.light3,
    gutterBackgroundColor: palette.gray.dark4,
    gutterActiveLineBackgroundColor: rgba(palette.gray.dark2, 0.5),
    gutterFoldButtonColor: palette.white,
    cursorColor: palette.green.base,
    // Semi-transparent opacity so that the selection background can still be seen.
    activeLineBackgroundColor: rgba(palette.gray.dark2, 0.5),
    selectionBackgroundColor: palette.gray.dark1,
    bracketBorderColor: palette.gray.light1,
    infoGutterIconColor: encodeURIComponent(palette.blue.light1),
    warningGutterIconColor: encodeURIComponent(palette.yellow.light2),
    errorGutterIconColor: encodeURIComponent(palette.red.light1),
    foldPlaceholderColor: palette.gray.base,
    foldPlaceholderBackgroundColor: palette.gray.dark3,
  },
} as const;

function getStylesForTheme(theme: CodemirrorThemeType) {
  return EditorView.theme(
    {
      '&': {
        color: editorPalette[theme].color,
        backgroundColor: editorPalette[theme].backgroundColor,
      },
      '& .cm-scroller': {
        fontSize: '13px',
        fontFamily: fontFamilies.code,
        lineHeight: `${spacing[3]}px`,
      },
      '&.cm-editor.cm-focused': {
        outline: 'none',
      },
      '& .cm-content': {
        caretColor: editorPalette[theme].cursorColor,
      },
      '& .cm-activeLine': {
        background: 'none',
      },
      '&.cm-focused .cm-activeLine': {
        backgroundColor: editorPalette[theme].activeLineBackgroundColor,
      },
      '& .cm-gutters': {
        color: editorPalette[theme].gutterColor,
        backgroundColor: editorPalette[theme].gutterBackgroundColor,
        border: 'none',
      },
      '& .cm-gutters > .cm-gutter:first-child > .cm-gutterElement': {
        paddingLeft: `${spacing[2]}px`,
      },
      '& .cm-gutters > .cm-gutter:last-child > .cm-gutterElement': {
        paddingRight: `${spacing[2]}px`,
      },
      '& .cm-gutter-lint': {
        width: 'auto',
      },
      '& .cm-gutter-lint .cm-gutterElement': {
        padding: '0',
      },
      '& .cm-gutter-lint .cm-lint-marker': {
        width: `${spacing[3]}px`,
        height: `${spacing[3]}px`,
        padding: '2px',
      },
      '& .cm-gutter-lint .cm-lint-marker-info': {
        content: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 16 16'%3E%3Cpath fill='${editorPalette[theme].infoGutterIconColor}' fill-rule='evenodd' d='M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14ZM9 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM8 6a1 1 0 0 1 1 1v4h.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1 0-1H7V7h-.5a.5.5 0 0 1 0-1H8Z' clip-rule='evenodd'/%3E%3C/svg%3E%0A")`,
      },
      '& .cm-gutter-lint .cm-lint-marker-warning': {
        content: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 16 16'%3E%3Cpath fill='${editorPalette[theme].warningGutterIconColor}' fill-rule='evenodd' d='M8.864 2.514a.983.983 0 0 0-1.728 0L1.122 13.539A.987.987 0 0 0 1.986 15h12.028a.987.987 0 0 0 .864-1.461L8.864 2.514ZM7 6a1 1 0 0 1 2 0v4a1 1 0 1 1-2 0V6Zm2 7a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z' clip-rule='evenodd'/%3E%3C/svg%3E%0A")`,
      },
      '& .cm-gutter-lint .cm-lint-marker-error': {
        content: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 16 16'%3E%3Cpath fill='${editorPalette[theme].errorGutterIconColor}' fill-rule='evenodd' d='M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm1.414-9.828a1 1 0 1 1 1.414 1.414L9.414 8l1.414 1.414a1 1 0 1 1-1.414 1.414L8 9.414l-1.414 1.414a1 1 0 1 1-1.414-1.414L6.586 8 5.172 6.586a1 1 0 0 1 1.414-1.414L8 6.586l1.414-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E%0A")`,
      },

      '& .cm-activeLineGutter': {
        background: 'none',
      },
      '&.cm-focused .cm-activeLineGutter': {
        backgroundColor: editorPalette[theme].gutterActiveLineBackgroundColor,
      },
      '& .cm-foldPlaceholder': {
        display: 'inline-block',
        border: 'none',
        color: editorPalette[theme].foldPlaceholderColor,
        backgroundColor: editorPalette[theme].foldPlaceholderBackgroundColor,
        boxShadow: `inset 0 0 0 1px ${editorPalette[theme].foldPlaceholderColor}`,
        padding: '0 2px',
      },
      '& .foldMarker': {
        width: `${spacing[3]}px`,
        height: `${spacing[3]}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      },
      '& .foldMarker > svg': {
        width: '12px',
        height: '12px',
        display: 'block',
        color: editorPalette[theme].gutterFoldButtonColor,
      },
      '& .cm-selectionBackground': {
        backgroundColor: editorPalette[theme].selectionBackgroundColor,
      },
      '&.cm-focused .cm-matchingBracket': {
        background: 'none',
        boxShadow: `0 0 0 1px ${editorPalette[theme].bracketBorderColor}`,
        borderRadius: '2px',
      },
      '& .cm-selectionBackground:first-child': {
        borderTopLeftRadius: '3px',
        borderTopRightRadius: '3px',
      },
      '& .cm-selectionBackground:last-child': {
        borderBottomLeftRadius: '3px',
        borderBottomRightRadius: '3px',
      },
      '& .cm-cursor': {
        borderLeft: '2px solid',
        borderColor: editorPalette[theme].cursorColor,
        marginLeft: '-1px',
      },
    },
    { dark: theme === 'dark' }
  );
}

const themeStyles = {
  light: getStylesForTheme('light'),
  dark: getStylesForTheme('dark'),
} as const;

function getHighlightStyleForTheme(theme: CodemirrorThemeType) {
  // For the full list of tags parsed by lezer for javascript / json see:
  //   https://github.com/lezer-parser/javascript/blob/main/src/highlight.js
  //   https://github.com/lezer-parser/json/blob/main/src/highlight.js
  return HighlightStyle.define(
    [
      {
        tag: [
          t.null,
          t.controlKeyword,
          t.operatorKeyword,
          t.definitionKeyword,
          t.moduleKeyword,
          t.keyword,
          t.modifier,
        ],
        color: codePalette[theme][10],
      },
      {
        tag: [t.number, t.bool, t.function(t.variableName), t.regexp],
        color: codePalette[theme][9],
      },
      {
        tag: [t.string, t.special(t.string)],
        color: codePalette[theme][7],
        fontWeight: 600,
      },
      {
        tag: [t.meta],
        color: codePalette[theme][6],
      },
      {
        tag: [t.propertyName, t.atom, t.self],
        color: codePalette[theme][5],
      },
      {
        tag: [
          t.separator,
          t.squareBracket,
          t.brace,
          t.variableName,
          t.definition(t.variableName),
          t.updateOperator,
          t.arithmeticOperator,
          t.logicOperator,
          t.bitwiseOperator,
          t.compareOperator,
          t.function(t.punctuation),
          t.punctuation,
          t.paren,
          t.derefOperator,
        ],
        color: codePalette[theme][3],
      },
      {
        tag: [t.lineComment, t.blockComment],
        color: codePalette[theme][2],
        fontStyle: 'italic',
      },
    ],
    { themeType: theme }
  );
}

const highlightStyles = {
  light: getHighlightStyleForTheme('light'),
  dark: getHighlightStyleForTheme('dark'),
} as const;

// We don't have any other cases we need to support in a base editor
type EditorLanguage = 'json' | 'javascript';

type Annotation = Pick<Diagnostic, 'from' | 'to' | 'severity' | 'message'>;

type EditorProps = {
  language?: EditorLanguage;
  onChangeText?: (text: string, event?: any) => void;
  onLoad?: (editor: EditorView) => void;
  darkMode?: boolean;
  showLineNumbers?: boolean;
  showFoldGutter?: boolean;
  readOnly?: boolean;
  className?: string;
  'data-testid'?: string;
  annotations?: Annotation[];
  completer?: CompletionSource;
} & (
  | { text: string; initialText?: never }
  | { text?: never; initialText: string }
);

function createFoldGutterExtension() {
  return foldGutter({
    markerDOM(open) {
      const marker = document.createElement('span');
      marker.className = `foldMarker foldMarker${open ? 'Open' : 'Closed'}`;
      marker.ariaHidden = 'true';
      marker.title = open ? 'Fold code block' : 'Unfold code block';
      marker.innerHTML = open
        ? `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16"><path fill="currentColor" d="M8.679 10.796a.554.554 0 0 1-.858 0L4.64 6.976C4.32 6.594 4.582 6 5.069 6h6.362c.487 0 .748.594.43.976l-3.182 3.82z"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16"><path fill="currentColor" d="M10.796 7.321a.554.554 0 0 1 0 .858l-3.82 3.181c-.382.319-.976.058-.976-.429V4.57c0-.487.594-.748.976-.43l3.82 3.182z"/></svg>`;
      return marker;
    },
  });
}

const javascriptExpression = javascriptLanguage.configure({
  // We always use editor to edit single expressions in Compass
  top: 'SingleExpression',
});

const languages: Record<EditorLanguage, () => LanguageSupport> = {
  json: json,
  javascript() {
    return new LanguageSupport(javascriptExpression);
  },
};

const languageName = Facet.define<EditorLanguage>({});

/**
 * https://codemirror.net/examples/config/#dynamic-configuration
 * @param fn
 * @param editorViewRef
 * @param value
 * @returns
 */
function useCodemirrorExtensionCompartment<T>(
  fn: () => Extension | Extension[],
  value: T,
  editorViewRef: React.RefObject<EditorView | undefined>
): Extension {
  const extensionCreatorRef = useRef(fn);
  extensionCreatorRef.current = fn;

  const compartmentRef = useRef<Compartment>();
  compartmentRef.current ??= new Compartment();

  const initialExtensionRef = useRef<Extension>();
  initialExtensionRef.current ??= compartmentRef.current.of(
    extensionCreatorRef.current()
  );

  useEffectOnChange(() => {
    editorViewRef.current?.dispatch({
      effects: compartmentRef.current?.reconfigure(
        extensionCreatorRef.current()
      ),
    });
  }, value);
  return initialExtensionRef.current;
}

const BaseEditor: React.FunctionComponent<EditorProps> & {
  foldAll: typeof foldAll;
  unfoldAll: typeof unfoldAll;
  copyAll: typeof copyAll;
  prettify: typeof prettify;
} = ({
  initialText: _initialText,
  text,
  onChangeText = () => {
    /**/
  },
  language = 'json',
  showLineNumbers = true,
  showFoldGutter = true,
  annotations = [],
  completer,
  darkMode: _darkMode,
  className,
  readOnly = false,
  onLoad = () => {
    /**/
  },
  ...props
}) => {
  const darkMode = useDarkMode(_darkMode);
  const onChangeTextRef = useRef(onChangeText);
  const onLoadRef = useRef(onLoad);
  const initialTextProvided = useRef(!!_initialText);
  const initialText = useRef(_initialText ?? text);
  const initialLanguage = useRef(language);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView>();

  // Always keep the latest reference of the callbacks
  onChangeTextRef.current = onChangeText;
  onLoadRef.current = onLoad;

  const languageExtension = useCodemirrorExtensionCompartment(
    () => {
      return [languages[language](), languageName.of(language)];
    },
    language,
    editorViewRef
  );

  const readOnlyExtension = useCodemirrorExtensionCompartment(
    () => {
      return [EditorState.readOnly.of(readOnly)].concat(
        readOnly ? [] : [highlightActiveLine(), highlightActiveLineGutter()]
      );
    },
    readOnly,
    editorViewRef
  );

  const themeConfigExtension = useCodemirrorExtensionCompartment(
    () => {
      return themeStyles[darkMode ? 'dark' : 'light'];
    },
    darkMode,
    editorViewRef
  );

  const lineNumbersExtension = useCodemirrorExtensionCompartment(
    () => {
      return showLineNumbers ? lineNumbers() : [];
    },
    showLineNumbers,
    editorViewRef
  );

  const foldGutterExtension = useCodemirrorExtensionCompartment(
    () => {
      return showFoldGutter ? createFoldGutterExtension() : [];
    },
    showFoldGutter,
    editorViewRef
  );

  const annotationsGutterExtension = useCodemirrorExtensionCompartment(
    () => {
      return annotations.length === 0 ? [] : lintGutter();
    },
    annotations.length === 0,
    editorViewRef
  );

  const autocomletionExtension = useCodemirrorExtensionCompartment(
    () => {
      return completer
        ? autocompletion({
            activateOnTyping: true,
            override: [completer],
          })
        : [];
    },
    completer,
    editorViewRef
  );

  useLayoutEffect(() => {
    if (!containerRef.current) {
      throw new Error("Can't mount editor: DOM node is missing");
    }

    const domNode = containerRef.current;

    const editor = (editorViewRef.current = new EditorView({
      doc: initialText.current,
      // Cherry-picked from codemirror basicSetup extensions to match the ones
      // we had with ace-editor. There are many more that we might want to add,
      // but this is good as a starting point
      // https://github.com/codemirror/basic-setup/blob/5b4dafdb3b02271bd3fd507d86982208457d8c5b/src/codemirror.ts#L12-L49
      extensions: [
        lineNumbersExtension,
        history(),
        foldGutterExtension,
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocomletionExtension,
        annotationsGutterExtension,
        languageExtension,
        syntaxHighlighting(highlightStyles['light']),
        syntaxHighlighting(highlightStyles['dark']),
        themeConfigExtension,
        keymap.of([
          {
            key: 'Ctrl-Shift-b',
            run: prettify,
          },
          {
            key: 'Ctrl-Shift-c',
            run: copyAll,
          },
          ...defaultKeymap,
          ...closeBracketsKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          // Breaks keyboard navigation out of the editor, but we want that
          // https://codemirror.net/examples/tab/
          indentWithTab,
        ]),
        readOnlyExtension,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const text = editor.state.sliceDoc() ?? '';
            onChangeTextRef.current(text, update);
          }
        }),
      ],
      parent: domNode,
    }));

    // For debugging / e2e tests purposes
    (domNode as any)._cm = editor;

    onLoadRef.current(editor);

    if (editor && initialLanguage.current === 'json') {
      // By default codemirror uses partial parser that will parse only visible
      // part of the code on the screen. This is extremely performant, but
      // collides with our folding logic for the json view. For json we collapse
      // everything but the very top level document. To be able to do that we
      // need to ensure that the whole syntax tree is available to the fold
      // extension.
      //
      // WARNING: This is a massive performance bottleneck in editor rendering,
      // we do parsing with a timeout to avoid locking main thread for too long,
      // but even this is a compromise. If this becomes an issue, we might
      // consider disabling this folding by default.
      const docLength = editor.state.doc.length;
      const isSyntaxTreeAvailable =
        syntaxTreeAvailable(editor.state, docLength) ||
        forceParsing(editor, docLength, 150);
      if (isSyntaxTreeAvailable) {
        foldAll(editor);
      } else {
        // warn: document is to big to be parsed and folded, this is not a critical issue, just a ui problem
      }
    }

    return () => {
      delete (domNode as any)._cm;
      editor.destroy();
    };
  }, [
    // Make sure that this effect is never updated as this will cause the whole
    // editor to re-mount causing weird behavior and possible performance
    // bottlenecks
    //
    // All the following values are refs which will not change value after
    // initial mount and so will not re-trigger this effect
    annotationsGutterExtension,
    foldGutterExtension,
    languageExtension,
    lineNumbersExtension,
    readOnlyExtension,
    themeConfigExtension,
    autocomletionExtension,
  ]);

  useEffect(() => {
    // Ignore changes to `text` prop if `initialText` was provided
    if (initialTextProvided.current) {
      return;
    }

    // When the outside value is out of sync with the editor value, hard reset
    // the editor if we are in controlled mode (we might need to account for
    // cursor position, but currently this sort of update can happen only on
    // blur so we can ignore this for now)
    if (text !== editorViewRef.current?.state.sliceDoc()) {
      editorViewRef.current?.dispatch({
        changes: {
          from: 0,
          // Replace all the content
          to: editorViewRef.current.state.doc.length,
          insert: text,
        },
      });
    }
  }, [text]);

  useEffect(() => {
    editorViewRef.current?.dispatch({
      effects: setDiagnosticsEffect.of(annotations),
    });
  }, [annotations]);

  return (
    <div
      ref={containerRef}
      className={cx(editorStyle, className)}
      data-codemirror="true"
      {...props}
    ></div>
  );
};

function isTopNode(node?: any): boolean {
  return !node
    ? true
    : node.name === 'Array' || node.name === 'Property'
    ? false
    : node.name === 'JsonText'
    ? true
    : isTopNode(node.parent);
}

const foldAll: Command = (editor) => {
  const foldableProperties: { from: number; to: number }[] = [];
  syntaxTree(editor.state).iterate({
    enter(nodeRef) {
      if (
        ['{', '['].includes(String(nodeRef.name)) &&
        foldable(editor.state, nodeRef.from, nodeRef.to) &&
        !isTopNode(nodeRef.node)
      ) {
        if (!nodeRef.node.parent) {
          // isTopNode guarantees that we are not trying to fold something
          // without a parent
          throw new Error('Trying to fold node without parent');
        }
        const range = foldInside(nodeRef.node.parent);
        if (range) {
          foldableProperties.push(range);
        }
        // Returning `false` stops iteration over children, we don't need
        // to iterate children if the node we entered is foldable
        return false;
      }
    },
  });
  if (foldableProperties.length > 0) {
    editor.dispatch({
      effects: foldableProperties.map((range) => {
        return foldEffect.of(range);
      }),
    });
  }
  return !!foldableProperties.length;
};

const copyAll: Command = (editorView) => {
  void navigator.clipboard.writeText(editorView.state.sliceDoc());
  return true;
};

const prettify: Command = (editorView) => {
  // Can't prettify a read-only document
  if (editorView.state.facet(EditorState.readOnly)) {
    return false;
  }

  const language = editorView.state.facet(languageName)[0];
  const doc = editorView.state.sliceDoc();
  try {
    const formatted = _prettify(
      doc,
      language === 'json' ? 'json' : 'javascript-expression'
    );
    if (formatted !== doc) {
      editorView.dispatch({
        changes: {
          from: 0,
          to: editorView.state.doc.length,
          insert: formatted,
        },
      });
      return true;
    }
  } catch {
    // failed to parse, do nothing
  }
  return false;
};

BaseEditor.foldAll = foldAll;
BaseEditor.unfoldAll = unfoldAll;
BaseEditor.copyAll = copyAll;
BaseEditor.prettify = prettify;

export type { EditorView };

export { BaseEditor as JSONEditor };
