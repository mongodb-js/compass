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
 * - [ ] inline mode (disabled gutter extensions and adjusted theme)
 * - [ ] autocomplete
 * - [ ] lint annotations (for agg. builder)
 */
import React, { useEffect, useLayoutEffect, useRef } from 'react';
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
} from '@codemirror/language';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands';
import {
  //   autocompletion,
  //   completionKeymap,
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
} from '@mongodb-js/compass-components';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { Compartment, EditorState } from '@codemirror/state';
import type { LanguageSupport } from '@codemirror/language';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { codePalette } from '@mongodb-js/compass-components';

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
    gutterActiveLineBackgroundColor: palette.gray.light2,
    gutterFoldButtonColor: palette.black,
    cursorColor: palette.gray.base,
    activeLineBackgroundColor: palette.gray.light2,
    selectionBackgroundColor: palette.blue.light2,
    bracketBorderColor: palette.gray.light1,
  },
  dark: {
    color: codePalette.dark[3],
    backgroundColor: codePalette.dark[0],
    gutterColor: palette.gray.light3,
    gutterBackgroundColor: palette.gray.dark3,
    gutterActiveLineBackgroundColor: palette.gray.dark2,
    gutterFoldButtonColor: palette.white,
    cursorColor: palette.green.base,
    activeLineBackgroundColor: palette.gray.dark2,
    selectionBackgroundColor: palette.gray.dark1,
    bracketBorderColor: palette.gray.light1,
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
      '& .cm-activeLineGutter': {
        background: 'none',
      },
      '&.cm-focused .cm-activeLineGutter': {
        backgroundColor: editorPalette[theme].gutterActiveLineBackgroundColor,
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

type EditorProps = {
  language?: EditorLanguage;
  onChangeText?: (text: string, event?: any) => void;
  darkMode?: boolean;
  inline?: boolean;
  readOnly?: boolean;
  className?: string;
  'data-testid'?: string;
} & (
  | { text: string; initialText?: never }
  | { text?: never; initialText: string }
);

const languages: Record<EditorLanguage, () => LanguageSupport> = {
  json: json,
  javascript: javascript,
};

const BaseEditor: React.FunctionComponent<EditorProps> = ({
  initialText: _initialText,
  text,
  onChangeText = () => {
    /**/
  },
  language = 'json',
  darkMode: _darkMode,
  className,
  // TODO: Should disable gutter extensions
  // inline,
  readOnly = false,
  ...props
}) => {
  const darkMode = useDarkMode(_darkMode);
  const onChangeTextRef = useRef(onChangeText);
  const initialReadOnly = useRef(readOnly);
  const initialTextProvided = useRef(!!_initialText);
  const initialText = useRef(_initialText ?? text);
  const initialLanguage = useRef(language);
  const initialDarkMode = useRef(darkMode);
  const containerRef = useRef<HTMLDivElement>(null);
  const languageConfigRef = useRef<Compartment>();
  const readOnlyConfigRef = useRef<Compartment>();
  const themeConfigRef = useRef<Compartment>();
  const editorViewRef = useRef<EditorView>();

  // Always keep the latest reference of the onChange callback
  onChangeTextRef.current = onChangeText;

  useLayoutEffect(() => {
    // Dynamic configuration is an opt-in that requires some special handling
    // https://codemirror.net/examples/config/#dynamic-configuration
    languageConfigRef.current = new Compartment();
    readOnlyConfigRef.current = new Compartment();
    themeConfigRef.current = new Compartment();

    editorViewRef.current = new EditorView({
      doc: initialText.current,
      // Cherry-picked from codemirror basicSetup extensions to match the ones
      // we had with ace-editor. There are many more that we might want to add,
      // but this is good as a starting point
      // https://github.com/codemirror/basic-setup/blob/5b4dafdb3b02271bd3fd507d86982208457d8c5b/src/codemirror.ts#L12-L49
      extensions: [
        lineNumbers(),
        history(),
        foldGutter({
          markerDOM(open) {
            const marker = document.createElement('span');
            marker.className = `foldMarker foldMarker${
              open ? 'Open' : 'Closed'
            }`;
            marker.ariaHidden = 'true';
            marker.title = open ? 'Fold code block' : 'Unfold code block';
            marker.innerHTML = open
              ? `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16"><path fill="currentColor" d="M8.679 10.796a.554.554 0 0 1-.858 0L4.64 6.976C4.32 6.594 4.582 6 5.069 6h6.362c.487 0 .748.594.43.976l-3.182 3.82z"/></svg>`
              : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16"><path fill="currentColor" d="M10.796 7.321a.554.554 0 0 1 0 .858l-3.82 3.181c-.382.319-.976.058-.976-.429V4.57c0-.487.594-.748.976-.43l3.82 3.182z"/></svg>`;
            return marker;
          },
        }),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        // TODO: Make ace autocompleters work with codemirror format
        // autocompletion(),
        // TODO: https://codemirror.net/docs/ref/#lint.lintGutter
        // lintGutter(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        languageConfigRef.current.of(languages[initialLanguage.current]()),
        syntaxHighlighting(highlightStyles['light']),
        syntaxHighlighting(highlightStyles['dark']),
        themeConfigRef.current.of(
          themeStyles[initialDarkMode.current ? 'dark' : 'light']
        ),
        keymap.of([
          ...defaultKeymap,
          ...closeBracketsKeymap,
          ...historyKeymap,
          ...foldKeymap,
          // Breaks keyboard navigation out of the editor, but we want that
          // https://codemirror.net/examples/tab/
          indentWithTab,
          // TODO: "Prettify" and "Copy all" commands
        ]),
        readOnlyConfigRef.current.of(
          EditorState.readOnly.of(initialReadOnly.current)
        ),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const text = editorViewRef.current?.state.sliceDoc() ?? '';
            onChangeTextRef.current(text, update);
          }
        }),
      ],
      parent: containerRef.current!,
    });

    return () => {
      editorViewRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (language !== initialLanguage.current) {
      editorViewRef.current?.dispatch({
        effects: languageConfigRef.current?.reconfigure(languages[language]()),
      });
    }
  }, [language]);

  useEffect(() => {
    if (readOnly !== initialReadOnly.current) {
      editorViewRef.current?.dispatch({
        effects: readOnlyConfigRef.current?.reconfigure(
          EditorState.readOnly.of(readOnly)
        ),
      });
    }
  }, [readOnly]);

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
    if (darkMode !== initialDarkMode.current) {
      editorViewRef.current?.dispatch({
        effects: themeConfigRef.current?.reconfigure(
          themeStyles[darkMode ? 'dark' : 'light']
        ),
      });
    }
  }, [darkMode]);

  return (
    <div
      ref={containerRef}
      className={cx(editorStyle, className)}
      {...props}
    ></div>
  );
};

export { BaseEditor as JSONEditor };
