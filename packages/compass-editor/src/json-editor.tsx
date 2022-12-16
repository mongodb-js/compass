/**
 * TODO
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

// interface Base16Palette {
//   0: string; // Background
//   1: string; // Borders / non-text graphical accents
//   2: string; // Comments, Doctags, Formulas
//   3: string; // Default Text
//   4: string; // Highlights
//   5: string; // Variables, XML Tags, Markup Link Text, Markup Lists, Diff Deleted
//   6: string; // Classes, Markup Bold, Search Text Background
//   7: string; // Strings, Inherited Class, Markup Code, Diff Inserted
//   8: string; // Support, Regular Expressions, Escape Characters, Markup Quotes
//   9: string; // Functions, Methods, Classes, Names, Sections, Literals
//   10: string; // Keywords, Storage, Selector, Markup Italic, Diff Changed
// }

type ThemeType = 'light' | 'dark';

const editorPalette = {
  light: {
    color: codePalette.light[3],
    backgroundColor: codePalette.light[0],
    gutterColor: palette.gray.base,
    gutterBackgroundColor: palette.gray.light3,
    gutterActiveLineBackgroundColor: palette.gray.light2,
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
    cursorColor: palette.green.base,
    activeLineBackgroundColor: palette.gray.dark2,
    selectionBackgroundColor: palette.gray.dark1,
    bracketBorderColor: palette.gray.light1,
  },
} as const;

function getStylesForTheme(theme: ThemeType) {
  return EditorView.theme(
    {
      '&': {
        color: editorPalette[theme].color,
        backgroundColor: editorPalette[theme].backgroundColor,
        outline: 'none',
      },
      '.cm-content': {
        caretColor: editorPalette[theme].cursorColor,
      },
      '.cm-activeLine': {
        backgroundColor: editorPalette[theme].activeLineBackgroundColor,
      },
      '.cm-gutters': {
        color: editorPalette[theme].gutterColor,
        backgroundColor: editorPalette[theme].gutterBackgroundColor,
        border: 'none',
      },
      '.cm-activeLineGutter': {
        backgroundColor: editorPalette[theme].gutterActiveLineBackgroundColor,
      },
      '.cm-selectionBackground': {
        backgroundColor: editorPalette[theme].selectionBackgroundColor,
      },
      '.cm-selectionBackground:first-child': {
        borderTopLeftRadius: '3px',
        borderTopRightRadius: '3px',
      },
      '.cm-selectionBackground:last-child': {
        borderBottomLeftRadius: '3px',
        borderBottomRightRadius: '3px',
      },
      '.cm-cursor': {
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

function getHighlightStyleForTheme(theme: ThemeType) {
  // For the full list of tags parsed by leser for javascript / json see:
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

// const highlightStyleDark = HighlightStyle.define([], { themeType: 'dark' });

type EditorProps = {
  text: string;
  onChangeText?: (text: string, event?: any) => void;
  // We don't have any other cases we need to support in a base editor
  type: 'json' | 'javascript';
  darkMode?: boolean;
  inline?: boolean;
  readOnly?: boolean;
  className?: string;
  editorClassName?: string;
  'data-testid'?: string;
};

const languages: Record<EditorProps['type'], () => LanguageSupport> = {
  json: json,
  javascript: javascript,
};

const BaseEditor: React.FunctionComponent<EditorProps> = ({
  text,
  onChangeText = () => {
    /**/
  },
  type = 'json',
  darkMode: _darkMode,
  className,
  editorClassName,
  inline,
  readOnly = false,
  ...props
}) => {
  const darkMode = useDarkMode(_darkMode);
  const onChangeTextRef = useRef(onChangeText);
  const initialReadOnly = useRef(readOnly);
  const initialText = useRef(text);
  const initialType = useRef(type);
  const initialDarkMode = useRef<ThemeType>(darkMode ? 'dark' : 'light');
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
        foldGutter(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        // TODO
        // autocompletion(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        languageConfigRef.current.of(languages[initialType.current]()),
        syntaxHighlighting(highlightStyles['light']),
        syntaxHighlighting(highlightStyles['dark']),
        themeConfigRef.current.of(themeStyles[initialDarkMode.current]),
        keymap.of([
          ...defaultKeymap,
          ...closeBracketsKeymap,
          ...historyKeymap,
          ...foldKeymap,
          // Breaks keyboard navigation out of the editor, but we want that
          // https://codemirror.net/examples/tab/
          indentWithTab,
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
    if (type !== initialType.current) {
      editorViewRef.current?.dispatch({
        effects: languageConfigRef.current?.reconfigure(languages[type]()),
      });
    }
  }, [type]);

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
    if (text !== editorViewRef.current?.state.sliceDoc()) {
      console.log('update from outside');
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
