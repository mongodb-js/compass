import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type { Command, KeyBinding } from '@codemirror/view';
import {
  keymap,
  placeholder as codemirrorPlaceholder,
  drawSelection,
  highlightActiveLine,
  lineNumbers,
  highlightActiveLineGutter,
  tooltips,
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
  cursorDocEnd,
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands';
import type { Diagnostic } from '@codemirror/lint';
import { lintGutter, setDiagnosticsEffect } from '@codemirror/lint';
import type { CompletionSource } from '@codemirror/autocomplete';
import {
  acceptCompletion,
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
  snippetCompletion,
  startCompletion,
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
import { javascriptLanguage, javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import type { Extension, TransactionSpec } from '@codemirror/state';
import { Facet, Compartment, EditorState } from '@codemirror/state';
import {
  LanguageSupport,
  syntaxHighlighting,
  HighlightStyle,
} from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { rgba } from 'polished';

import { prettify as _prettify } from './prettify';
import type { Action } from './action-button';
import { ActionsContainer } from './actions-container';
import type { EditorRef } from './types';

// TODO(COMPASS-8453): Re-enable this once the linked tickets are resolved
// https://github.com/codemirror/dev/issues/1458
// https://issues.chromium.org/issues/375711382?pli=1
(EditorView as any).EDIT_CONTEXT = false;

const editorStyle = css({
  fontSize: 13,
  fontFamily: fontFamilies.code,
});

const disabledContainerStyles = css({
  borderRadius: spacing[100],
  boxShadow: `0 0 0 1px ${palette.gray.light1}`,
});

const disabledContainerDarkModeStyles = css({
  boxShadow: `0 0 0 1px ${palette.gray.dark2}`,
});

const hiddenScrollStyle = css({
  '& .cm-scroller': {
    overflow: '-moz-scrollbars-none',
    msOverflowStyle: 'none',
  },
  '& .cm-scroller::-webkit-scrollbar': {
    display: 'none',
  },
});

function isReadOnly(state: EditorState): boolean {
  return state.facet(EditorState.readOnly);
}

// Breaks keyboard navigation out of the editor, but we want that.
// A user has to hit `Escape` then `Tab` to enter keyboard navigation.
// Note that the ordering of these matters as no more key handlers are called
// after the first corresponding `run` function returns true.
// https://codemirror.net/examples/tab/
const tabKeymap: KeyBinding[] = [
  {
    key: 'Tab',
    run(context) {
      if (isReadOnly(context.state)) {
        return false;
      }
      return acceptCompletion(context);
    },
  },
  {
    key: 'Tab',
    run({ state, dispatch }) {
      if (isReadOnly(state)) {
        return false;
      }

      // `indentWithTab` will indent when `Tab` is pressed without any selection (like
      // in browser devtools for example). Instead we want to input the tab symbol in
      //  that case, to have behavior similar to VSCode's editors.
      if (!state.selection.ranges.some((range) => !range.empty)) {
        dispatch(
          state.update(state.replaceSelection('\t'), {
            scrollIntoView: true,
            userEvent: 'input',
          })
        );
        return true;
      }

      return false;
    },
  },
  indentWithTab,
];

export type CodemirrorThemeType = 'light' | 'dark';

export const editorPalette = {
  light: {
    color: codePalette.light[3],
    backgroundColor: codePalette.light[0],
    disabledColor: codePalette.light[2],
    disabledBackgroundColor: codePalette.light[1],
    gutterColor: codePalette.light[3],
    gutterBackgroundColor: codePalette.light[0],
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
    autocompleteColor: palette.black,
    autocompleteBackgroundColor: palette.gray.light3,
    autocompleteBorderColor: palette.gray.light2,
    autocompleteMatchColor: palette.green.dark1,
    autocompleteSelectedBackgroundColor: palette.gray.light2,
  },
  dark: {
    color: codePalette.dark[3],
    backgroundColor: codePalette.dark[0],
    disabledColor: codePalette.dark[3],
    disabledBackgroundColor: palette.gray.dark3,
    gutterColor: codePalette.dark[3],
    gutterBackgroundColor: codePalette.dark[0],
    gutterActiveLineBackgroundColor: rgba(palette.gray.dark2, 0.5),
    gutterFoldButtonColor: palette.white,
    cursorColor: palette.green.base,
    // Semi-transparent opacity so that the selection background can still be seen.
    activeLineBackgroundColor: rgba(palette.gray.dark2, 0.5),
    selectionBackgroundColor: palette.gray.dark2,
    bracketBorderColor: palette.gray.light1,
    infoGutterIconColor: encodeURIComponent(palette.blue.light1),
    warningGutterIconColor: encodeURIComponent(palette.yellow.light2),
    errorGutterIconColor: encodeURIComponent(palette.red.light1),
    foldPlaceholderColor: palette.gray.base,
    foldPlaceholderBackgroundColor: palette.gray.dark3,
    autocompleteColor: palette.gray.light1,
    autocompleteBackgroundColor: palette.gray.dark4,
    autocompleteBorderColor: palette.gray.dark1,
    autocompleteMatchColor: palette.gray.light3,
    autocompleteSelectedBackgroundColor: palette.gray.dark2,
  },
} as const;

const cmFontStyles = {
  fontSize: '13px',
  fontFamily: fontFamilies.code,
};

function getStylesForTheme(theme: CodemirrorThemeType) {
  return EditorView.theme(
    {
      '&': {
        color: editorPalette[theme].color,
        backgroundColor: editorPalette[theme].backgroundColor,
        maxHeight: '100%',
      },
      '& .cm-scroller': cmFontStyles,
      '&.cm-editor.cm-focused': {
        outline: 'none',
      },
      '& .cm-content': {
        paddingTop: `${spacing[1]}px`,
        paddingBottom: `${spacing[1]}px`,
        caretColor: editorPalette[theme].cursorColor,
      },
      '[contenteditable="false"] ': {
        borderRadius: `${spacing[100]}px`,
      },
      '.cm-content[contenteditable="false"] ': {
        cursor: 'not-allowed',
        color: editorPalette[theme].disabledColor,
        backgroundColor: editorPalette[theme].disabledBackgroundColor,
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
      '& .cm-gutter-lint': {
        width: `${spacing[3]}px`,
      },
      '& .cm-gutter-lint .cm-gutterElement': {
        padding: '0',
      },
      '& .cm-lineNumbers .cm-gutterElement': {
        userSelect: 'none',
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
      '&.cm-focused .cm-selectionBackground, ::selection': {
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
      '& .cm-tooltip': {
        ...cmFontStyles,
        color: editorPalette[theme].autocompleteColor,
        backgroundColor: editorPalette[theme].autocompleteBackgroundColor,
        border: `1px solid ${editorPalette[theme].autocompleteBorderColor}`,
      },
      '& .cm-tooltip.cm-tooltip-autocomplete > ul': {
        fontFamily: fontFamilies.code,
        boxShadow: `0 ${spacing[50]}px ${spacing[200]}px rgba(0, 0, 0, 0.25)`,
      },
      '& .cm-tooltip-autocomplete ul li': {
        display: 'flex',
      },
      '& .cm-tooltip-autocomplete ul li[aria-selected]': {
        color: editorPalette[theme].autocompleteColor,
        backgroundColor:
          editorPalette[theme].autocompleteSelectedBackgroundColor,
      },
      '& .cm-completionIcon-query-history': {
        marginRight: `${spacing[200]}px`,
        '&:after': {
          content: '""',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '16px',
          height: '16px',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14ZM7.25 4.75C7.25 4.33579 7.58579 4 8 4C8.41421 4 8.75 4.33579 8.75 4.75V7.90966L10.4939 9.43556C10.8056 9.70832 10.8372 10.1821 10.5644 10.4939C10.2917 10.8056 9.81786 10.8372 9.50613 10.5644L7.51059 8.81833C7.5014 8.8104 7.4924 8.80226 7.48361 8.79391C7.41388 8.7278 7.35953 8.65117 7.32087 8.56867C7.27541 8.47195 7.25 8.36394 7.25 8.25V4.75Z' fill='${encodeURIComponent(
            editorPalette[theme].autocompleteColor
          )}'/%3E%3C/svg%3E")`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        },
      },
      '& .cm-completionIcon-favorite': {
        marginRight: `${spacing[200]}px`,
        '&:after': {
          content: '""',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '16px',
          height: '16px',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M5.65373 0.832474C5.78183 0.524491 6.21813 0.52449 6.34622 0.832474L7.49904 3.60417C7.55301 3.73401 7.67511 3.82272 7.81528 3.83396L10.8076 4.07385C11.1401 4.1005 11.2749 4.51545 11.0216 4.73244L8.74176 6.68534C8.63496 6.77682 8.58839 6.92036 8.62101 7.05714L9.31746 9.9771C9.39486 10.3015 9.04191 10.558 8.75729 10.3841L6.19545 8.8194C6.07544 8.74612 5.92451 8.74612 5.80451 8.8194L3.2427 10.3841C2.95804 10.558 2.60507 10.3015 2.68246 9.9771L3.37898 7.05714C3.41161 6.92036 3.36497 6.77682 3.25817 6.68534L0.978375 4.73244C0.725048 4.51545 0.859867 4.1005 1.19236 4.07385L4.18464 3.83396C4.32481 3.82272 4.44691 3.73401 4.50092 3.60417L5.65373 0.832474Z' fill='${encodeURIComponent(
            editorPalette[theme].autocompleteColor
          )}'/%3E%3C/svg%3E")`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        },
      },
      '& .cm-completionIcon-field': {
        marginRight: `${spacing[50]}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '16px',
        height: '16px',
        '&:after': {
          content: '""',
          display: 'block',
          width: '13px',
          height: '11px',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='13' height='11' viewBox='0 0 13 11' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 4.06383L4.96 5.78723M1 4.06383L7.18333 1.19342C7.44783 1.07064 7.75273 1.06942 8.0182 1.19009L12 3M1 4.06383V7.29287C1 7.66257 1.20398 8.00212 1.53039 8.17574L4.96 10M4.96 5.78723L12 3M4.96 5.78723V10M12 3V6.45563C12 6.86203 11.7541 7.22801 11.3778 7.38153L4.96 10' stroke='${encodeURIComponent(
            editorPalette[theme].autocompleteColor
          )}' stroke-width='1.3'/%3E%3C/svg%3E")`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        },
      },
      '& .cm-completionIcon-method': {
        marginRight: `${spacing[50]}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '16px',
        height: '16px',
        '&:after': {
          content: '""',
          display: 'block',
          width: '13px',
          height: '13px',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='13' height='13' viewBox='0 0 13 13' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg clip-path='url(%23clip0_914_100226)'%3E%3Cpath d='M1.5 4.13357L6.45 7.11111M1.5 4.13357L5.92043 1.33524C6.2443 1.13022 6.65686 1.12836 6.98256 1.33046L11.5 4.13357M1.5 4.13357V8.26879C1.5 8.60888 1.67284 8.92565 1.95883 9.1097L6.45 12M6.45 7.11111L11.5 4.13357M6.45 7.11111V12M11.5 4.13357V8.26289C11.5 8.6062 11.3239 8.92551 11.0335 9.10868L6.45 12' stroke='${encodeURIComponent(
            editorPalette[theme].autocompleteColor
          )}' stroke-width='1.3'/%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='clip0_914_100226'%3E%3Crect width='13' height='13' fill='white'/%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E")`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        },
      },
      '& .cm-completionLabel': {
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        lineHeight: '110%',
        verticalAlign: 'middle',
      },
      '& .cm-completionDetail': {
        color: rgba(editorPalette[theme].autocompleteColor, 0.5),
        fontStyle: 'normal',
        marginRight: '1em',
        marginLeft: '1em',
      },
      '& .cm-completionMatchedText': {
        color: editorPalette[theme].autocompleteMatchColor,
        fontWeight: 'bold',
        textDecoration: 'none',
      },
      '.cm-tooltip.cm-completionInfo': {
        boxShadow: `0 ${spacing[50]}px ${spacing[200]}px rgba(0, 0, 0, 0.25)`,
        overflow: 'auto',
        marginTop: 0,
        paddingTop: 0,
        fontSize: '12px',
        maxHeight: `${spacing[1600] * 5}px`,
      },
      '& .cm-tooltip .completion-info p': {
        margin: 0,
        marginRight: `${spacing[2]}px`,
        marginTop: `${spacing[2]}px`,
        marginBottom: `${spacing[2]}px`,
      },
      '& .cm-tooltip .completion-info p:first-child': {
        marginTop: 0,
      },
      '& .cm-tooltip .completion-info p:last-child': {
        marginBottom: 0,
      },
      '& .cm-widgetBuffer': {
        // Default is text-top which causes weird 1px added to the line height
        // when widget (in our case this is placeholder widget) is shown in the
        // editor
        verticalAlign: 'top',
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
type EditorLanguage = 'json' | 'javascript' | 'javascript-expression';

export type Annotation = Pick<
  Diagnostic,
  'from' | 'to' | 'severity' | 'message'
>;

type EditorProps = {
  language?: EditorLanguage;
  onChangeText?: (text: string, event?: any) => void;
  onLoad?: (editor: EditorView) => void;
  onFocus?: (event: React.FocusEvent<HTMLDivElement>) => void;
  onBlur?: (editor: React.FocusEvent<HTMLDivElement>) => void;
  onPaste?: (editor: React.ClipboardEvent<HTMLDivElement>) => void;
  darkMode?: boolean;
  disabled?: boolean;
  showLineNumbers?: boolean;
  showFoldGutter?: boolean;
  showAnnotationsGutter?: boolean;
  showScroll?: boolean;
  highlightActiveLine?: boolean;
  readOnly?: boolean;
  'data-testid'?: string;
  annotations?: Annotation[];
  completer?: CompletionSource;
  minLines?: number;
  maxLines?: number;
  lineHeight?: number;
  placeholder?: Parameters<typeof codemirrorPlaceholder>[0];
  commands?: readonly KeyBinding[];
  initialJSONFoldAll?: boolean;
} & (
  | { text: string; initialText?: never }
  | { text?: never; initialText: string }
) &
  Pick<
    React.HTMLProps<HTMLDivElement>,
    'id' | 'className' | 'onFocus' | 'onPaste' | 'onBlur'
  >;

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

export const languages: Record<EditorLanguage, () => LanguageSupport> = {
  json,
  javascript,
  'javascript-expression': () => {
    return new LanguageSupport(javascriptExpression);
  },
};

export const languageName = Facet.define<EditorLanguage>({});

async function wait(ms?: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitUntilEditorIsReady(
  editorView: EditorView,
  signal?: AbortSignal
): Promise<boolean> {
  while ((editorView as any).updateState !== 0) {
    if (signal?.aborted) {
      return false;
    }
    await wait();
  }

  return true;
}

/**
 * Codemirror editor throws when the state update is being applied while another
 * one is in progress and doesn't give us a way to schedule updates otherwise.
 * They do have some good reasoning[0] for it, but as we are using this library
 * in React context where having multiple effects instead of grouping them all
 * in one place is preferable over grouping them all together, we have this
 * method to allow to schedule updates and apply them when editor gets idle
 *
 * [0]: https://discuss.codemirror.net/t/should-dispatched-transactions-be-added-to-a-queue/4610/4
 */
async function scheduleDispatch(
  editorView: EditorView,
  transactions: TransactionSpec | TransactionSpec[],
  signal?: AbortSignal
): Promise<boolean> {
  await waitUntilEditorIsReady(editorView, signal);
  transactions = Array.isArray(transactions) ? transactions : [transactions];
  editorView.dispatch(...transactions);
  return true;
}

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
    if (!editorViewRef.current) {
      return;
    }

    const controller = new AbortController();

    void scheduleDispatch(
      editorViewRef.current,
      {
        effects: compartmentRef.current?.reconfigure(
          extensionCreatorRef.current()
        ),
      },
      controller.signal
    );

    return () => {
      controller.abort();
    };
  }, value);
  return initialExtensionRef.current;
}

const BaseEditor = React.forwardRef<EditorRef, EditorProps>(function BaseEditor(
  {
    initialText: _initialText,
    text,
    onChangeText,
    language = 'json',
    showLineNumbers = true,
    showFoldGutter = true,
    showAnnotationsGutter = true,
    showScroll = true,
    highlightActiveLine: shouldHighlightActiveLine = true,
    annotations,
    completer,
    darkMode: _darkMode,
    disabled = false,
    className,
    readOnly = false,
    onLoad = () => {
      /**/
    },
    onFocus = () => {
      /**/
    },
    onBlur = () => {
      /**/
    },
    onPaste = () => {
      /**/
    },
    minLines,
    maxLines,
    lineHeight = 16,
    placeholder,
    commands,
    initialJSONFoldAll: _initialJSONFoldAll = true,
    ...props
  },
  ref
) {
  const darkMode = useDarkMode(_darkMode);
  const onChangeTextRef = useRef(onChangeText);
  const onLoadRef = useRef(onLoad);
  const onFocusRef = useRef(onFocus);
  const onBlurRef = useRef(onBlur);
  const onPasteRef = useRef(onPaste);
  const initialTextProvided = useRef(!!_initialText);
  const initialText = useRef(_initialText ?? text);
  const initialLanguage = useRef(language);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const editorViewRef = useRef<EditorView>();
  const [{ height: contentHeight, hasScroll }, setContentHeight] = useState({
    height: 0,
    hasScroll: false,
  });
  const initialJSONFoldAll = useRef(_initialJSONFoldAll);

  // Always keep the latest reference of the callbacks
  onChangeTextRef.current = onChangeText;
  onLoadRef.current = onLoad;
  onFocusRef.current = onFocus;
  onBlurRef.current = onBlur;
  onPasteRef.current = onPaste;

  useImperativeHandle(
    ref,
    () => {
      return {
        foldAll() {
          if (!editorViewRef.current) {
            return false;
          }
          return foldAll(editorViewRef.current);
        },
        unfoldAll() {
          if (!editorViewRef.current) {
            return false;
          }
          return unfoldAll(editorViewRef.current);
        },
        copyAll() {
          if (!editorViewRef.current) {
            return false;
          }
          return copyAll(editorViewRef.current);
        },
        prettify() {
          if (!editorViewRef.current) {
            return false;
          }
          return prettify(editorViewRef.current);
        },
        applySnippet(template: string) {
          if (!editorViewRef.current) {
            return false;
          }
          return applySnippet(editorViewRef.current, template);
        },
        focus() {
          if (!editorViewRef.current) {
            return false;
          }
          editorViewRef.current.focus();
          return true;
        },
        cursorDocEnd() {
          if (!editorViewRef.current) {
            return false;
          }
          return cursorDocEnd(editorViewRef.current);
        },
        startCompletion() {
          if (!editorViewRef.current) {
            return false;
          }
          return startCompletion(editorViewRef.current);
        },
        get editorContents() {
          if (!editorViewRef.current) {
            return null;
          }

          return getEditorContents(editorViewRef.current);
        },
        get editor() {
          return editorViewRef.current ?? null;
        },
      };
    },
    []
  );

  const languageExtension = useCodemirrorExtensionCompartment(
    () => {
      return [languages[language](), languageName.of(language)];
    },
    language,
    editorViewRef
  );

  const activeLineExtension = useCodemirrorExtensionCompartment(
    () => {
      return !readOnly && shouldHighlightActiveLine
        ? [highlightActiveLine(), highlightActiveLineGutter()]
        : [];
    },
    [readOnly, shouldHighlightActiveLine],
    editorViewRef
  );

  const readOnlyExtension = useCodemirrorExtensionCompartment(
    () => {
      return EditorState.readOnly.of(readOnly);
    },
    readOnly,
    editorViewRef
  );

  const editableExtension = useCodemirrorExtensionCompartment(
    () => {
      return EditorView.editable.of(!disabled);
    },
    disabled,
    editorViewRef
  );

  const themeConfigExtension = useCodemirrorExtensionCompartment(
    () => {
      return themeStyles[darkMode ? 'dark' : 'light'];
    },
    darkMode,
    editorViewRef
  );

  const lineHeightExtension = useCodemirrorExtensionCompartment(
    () => {
      // See https://codemirror.net/examples/styling/#overflow-and-scrolling
      return EditorView.theme({
        '& .cm-scroller': {
          lineHeight: `${lineHeight}px`,
          ...(maxLines &&
            maxLines < Infinity && {
              maxHeight: `${maxLines * lineHeight}px`,
            }),
          height: '100%',
          overflowY: 'auto',
        },
        '& .cm-content, & .cm-gutter': {
          ...(minLines && { minHeight: `${minLines * lineHeight}px` }),
        },
      });
    },
    [minLines, maxLines, lineHeight],
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

  // By default we want to show annotations gutter so that the gutters don't
  // jump when annotations are added / removed. This can be opted out by setting
  // showAnnotationsGutter to false
  const shouldShowAnnotationsGutter =
    showAnnotationsGutter || (annotations && annotations.length === 0);

  const annotationsGutterExtension = useCodemirrorExtensionCompartment(
    () => {
      return shouldShowAnnotationsGutter ? lintGutter() : [];
    },
    shouldShowAnnotationsGutter,
    editorViewRef
  );

  const autocompletionExtension = useCodemirrorExtensionCompartment(
    () => {
      return completer
        ? autocompletion({
            activateOnTyping: true,
            override: [completer],
            maxRenderedOptions: 50,
          })
        : [];
    },
    completer,
    editorViewRef
  );

  const placeholderExtension = useCodemirrorExtensionCompartment(
    () => {
      return placeholder ? codemirrorPlaceholder(placeholder) : [];
    },
    placeholder,
    editorViewRef
  );

  const commandsExtension = useCodemirrorExtensionCompartment(
    () => {
      return commands && commands.length > 0 ? keymap.of(commands) : [];
    },
    commands,
    editorViewRef
  );

  const updateEditorContentHeight = useCallback(() => {
    editorViewRef.current?.requestMeasure({
      read(view) {
        return [
          view.contentHeight,
          view.scrollDOM.scrollWidth > view.scrollDOM.clientWidth,
        ] as const;
      },
      write([height, hasScroll]) {
        setContentHeight((state) => {
          if (height !== state.height || hasScroll !== state.hasScroll) {
            return { height, hasScroll };
          }
          return state;
        });
      },
    });
  }, []);

  useLayoutEffect(() => {
    if (!editorContainerRef.current) {
      throw new Error("Can't mount editor: DOM node is missing");
    }

    const domNode = editorContainerRef.current;

    const editor = (editorViewRef.current = new EditorView({
      doc: initialText.current,
      // Cherry-picked from codemirror basicSetup extensions to match the ones
      // we had with ace-editor. There are many more that we might want to add,
      // but this is good as a starting point
      // https://github.com/codemirror/basic-setup/blob/5b4dafdb3b02271bd3fd507d86982208457d8c5b/src/codemirror.ts#L12-L49
      extensions: [
        EditorState.tabSize.of(2),
        annotationsGutterExtension,
        lineNumbersExtension,
        foldGutterExtension,
        history(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletionExtension,
        languageExtension,
        syntaxHighlighting(highlightStyles['light']),
        syntaxHighlighting(highlightStyles['dark']),
        activeLineExtension,
        lineHeightExtension,
        themeConfigExtension,
        placeholderExtension,
        // User provided commands should take precedence over default keybindings.
        commandsExtension,
        // The order of this keymap matters, when the `run` function of the corresponding key
        // returns false it goes to the next corresponding key, if it returns true then
        // it completes and does not try further handlers.
        keymap.of([
          {
            key: 'Ctrl-Shift-b',
            run: prettify,
          },
          {
            key: 'Ctrl-Shift-c',
            run: copyAll,
          },
          // Close brackets keymap overrides default backspace handler for
          // matching bracket case
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          ...tabKeymap,
        ]),
        // Supply the document body as the tooltip parent
        // because we are using containment contexts for container
        // queries which offset things otherwise.
        tooltips({
          parent: document.body,
        }),
        editableExtension,
        readOnlyExtension,
        EditorView.updateListener.of((update) => {
          updateEditorContentHeight();
          const editorText = editor.state.sliceDoc() ?? '';

          if (update.docChanged) {
            onChangeTextRef.current?.(editorText, update);
          }
        }),
        /**
         * EditorView.domEventHandlers use real DOM events. However,
         * we want to bubble these events up to our React components
         * properly. We will be casting them to React synthetic events,
         * as for our use case, they should behave identical.
         */
        EditorView.domEventHandlers({
          focus(event: FocusEvent) {
            onFocusRef.current?.(
              event as unknown as React.FocusEvent<HTMLDivElement>
            );
          },
          blur(event: FocusEvent) {
            onBlurRef.current?.(
              event as unknown as React.FocusEvent<HTMLDivElement>
            );
          },
          paste(event: ClipboardEvent) {
            onPasteRef.current?.(
              event as unknown as React.ClipboardEvent<HTMLDivElement>
            );
          },
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
      if (initialJSONFoldAll.current && isSyntaxTreeAvailable) {
        foldAll(editor);
      } else {
        // warn: document is to big to be parsed and folded, this is not a critical issue, just a ui problem
      }
    }

    updateEditorContentHeight();

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
    // initial render and so will not re-trigger this effect
    annotationsGutterExtension,
    foldGutterExtension,
    languageExtension,
    lineNumbersExtension,
    readOnlyExtension,
    themeConfigExtension,
    autocompletionExtension,
    lineHeightExtension,
    activeLineExtension,
    placeholderExtension,
    commandsExtension,
    updateEditorContentHeight,
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
    if (
      editorViewRef.current &&
      text !== (editorViewRef.current.state.sliceDoc() ?? '')
    ) {
      const controller = new AbortController();

      void scheduleDispatch(
        editorViewRef.current,
        {
          changes: {
            from: 0,
            // Replace all the content
            to: editorViewRef.current.state.doc.length,
            insert: text,
          },
        },
        controller.signal
      );

      return () => {
        controller.abort();
      };
    }
  }, [text]);

  useEffect(() => {
    if (!editorViewRef.current) {
      return;
    }

    const controller = new AbortController();

    void scheduleDispatch(
      editorViewRef.current,
      {
        effects: setDiagnosticsEffect.of(annotations ?? []),
      },
      controller.signal
    );

    return () => {
      controller.abort();
    };
  }, [annotations]);

  // We wrap editor in a relatively positioned container followed by an absolute
  // one to be able to create a new DOM layer that will prevent component
  // changes from triggering pricey layout reflows for the whole document. We
  // then manually keep conatiner height in sync with the editor height to make
  // sure that the element actually takes all the required space in the page
  // layout. This is a performance optimization that is mainly needed for the
  // query bar component where typing anything in the editor might trigger a
  // layout reflow for the whole document which causes .5s lag in the UI on
  // every character input in worst case scenarios
  useLayoutEffect(() => {
    if (containerRef.current) {
      const scrollHeight = hasScroll && showScroll ? 10 : 0;
      const height =
        Math.min(contentHeight, (maxLines ?? Infinity) * lineHeight) +
        scrollHeight;
      containerRef.current.style.height = `${height}px`;
    }
  }, [maxLines, contentHeight, hasScroll, lineHeight, showScroll]);

  return (
    <div
      ref={containerRef}
      className={cx(
        disabled && disabledContainerStyles,
        disabled && darkMode && disabledContainerDarkModeStyles,
        className
      )}
      style={{
        width: '100%',
        minHeight: Math.max(lineHeight, (minLines ?? 0) * lineHeight),
        position: 'relative',
        maxHeight: '100%',
      }}
    >
      <div
        ref={editorContainerRef}
        className={cx(editorStyle, !showScroll && hiddenScrollStyle)}
        style={{
          // We're forcing editor to it's own layer by setting position to
          // absolute to prevent editor layout changes and style
          // recalculations to cause layout reflows for the whole document
          //
          // Having position absolute here causes element to create it's
          // own layer that keeps all pricey layout operations inside.
          // This works in combination wit parent height update. See above
          position: 'absolute',
          width: '100%',
          height: '100%',
        }}
        data-codemirror="true"
        {...props}
      ></div>
    </div>
  );
});

function isTopNode(node?: any): boolean {
  return !node
    ? true
    : node.name === 'Array' || node.name === 'Property'
    ? false
    : node.name === 'JsonText'
    ? true
    : isTopNode(node.parent);
}

const applySnippet = (editor: EditorView, template: string): boolean => {
  if (isReadOnly(editor.state)) {
    return false;
  }
  const completion = snippetCompletion(template, { label: template });
  if (typeof completion.apply === 'function') {
    completion.apply(editor, completion, 0, editor.state.doc.length);
    return true;
  } else {
    return false;
  }
};

const getEditorContents = (
  editor: EditorView,
  from?: number,
  to?: number
): string => {
  return editor.state.sliceDoc(from, to) ?? '';
};

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
    void scheduleDispatch(editor, {
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
  if (isReadOnly(editorView.state)) {
    return false;
  }

  const language = editorView.state.facet(languageName)[0];
  const doc = editorView.state.sliceDoc();
  try {
    const formatted = _prettify(doc, language);
    if (formatted !== doc) {
      void scheduleDispatch(editorView, {
        changes: {
          from: 0,
          to: editorView.state.doc.length,
          insert: formatted,
        },
        scrollIntoView: true,
      });
      return true;
    }
  } catch {
    // failed to parse, do nothing
  }
  return false;
};

export type { EditorView, KeyBinding as Command };

type InlineEditorProps = Omit<
  EditorProps,
  | 'text'
  | 'showLineNumbers'
  | 'showFoldGutter'
  | 'showAnnotationsGutter'
  | 'showScroll'
  | 'highlightActiveLine'
  | 'minLines'
  | 'annotations'
> &
  (
    | { text: string; initialText?: never }
    | { text?: never; initialText: string }
  );

const inlineStyles = css({
  '& .cm-editor': {
    backgroundColor: 'transparent',
  },
});

const InlineEditor = React.forwardRef<EditorRef, InlineEditorProps>(
  function InlineEditor({ className, ...props }, forwardRef) {
    return (
      <BaseEditor
        ref={forwardRef}
        maxLines={10}
        showFoldGutter={false}
        showLineNumbers={false}
        showAnnotationsGutter={false}
        showScroll={false}
        highlightActiveLine={false}
        className={cx(inlineStyles, className)}
        language="javascript-expression"
        {...props}
      ></BaseEditor>
    );
  }
);

const multilineEditorContainerStyle = css({
  position: 'relative',
  height: '100%',
  backgroundColor: editorPalette.light.backgroundColor,
  [`&:focus-within > .multiline-editor-actions,
    &:hover > .multiline-editor-actions`]: {
    display: 'flex',
  },
});

const multilineEditorContainerWithActionsStyle = css({
  minHeight: spacing[5] - 2,
});

const multilineEditorContainerWithExpandStyle = css({
  ['& .cm-gutters']: {
    // Offset to prevent the "expand" button from overlapping with fold / unfold icons
    paddingLeft: spacing[500],
  },
});

const multilineEditorContainerDarkModeStyle = css({
  backgroundColor: editorPalette.dark.backgroundColor,
});

type MultilineEditorProps = EditorProps & {
  customActions?: Action[];
  copyable?: boolean;
  formattable?: boolean;
  editorClassName?: string;
  actionsClassName?: string;
  onExpand?: () => void;
  expanded?: boolean;
};

const MultilineEditor = React.forwardRef<EditorRef, MultilineEditorProps>(
  function MultilineEditor(
    {
      customActions,
      copyable = true,
      formattable = true,
      className,
      editorClassName,
      actionsClassName,
      darkMode: _darkMode,
      onExpand,
      expanded,
      ...props
    }: MultilineEditorProps,
    ref
  ) {
    const darkMode = useDarkMode(_darkMode);
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<EditorRef>(null);

    useImperativeHandle(
      ref,
      () => {
        return {
          foldAll() {
            return editorRef.current?.foldAll() ?? false;
          },
          unfoldAll() {
            return editorRef.current?.unfoldAll() ?? false;
          },
          copyAll() {
            return editorRef.current?.copyAll() ?? false;
          },
          prettify() {
            return editorRef.current?.prettify() ?? false;
          },
          focus() {
            return editorRef.current?.focus() ?? false;
          },
          applySnippet(template: string) {
            return editorRef.current?.applySnippet(template) ?? false;
          },
          cursorDocEnd() {
            return editorRef.current?.cursorDocEnd() ?? false;
          },
          startCompletion() {
            return editorRef.current?.startCompletion() ?? false;
          },
          get editorContents() {
            return editorRef.current?.editorContents ?? null;
          },
          get editor() {
            return editorRef.current?.editor ?? null;
          },
        };
      },
      []
    );

    const hasCustomActions = customActions && customActions.length > 0;
    const hasActions = copyable || formattable || hasCustomActions;

    return (
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
      <div
        ref={containerRef}
        className={cx(
          multilineEditorContainerStyle,
          darkMode && multilineEditorContainerDarkModeStyle,
          hasActions && multilineEditorContainerWithActionsStyle,
          onExpand && multilineEditorContainerWithExpandStyle,
          className
        )}
        // We want folks to be able to click into the container element
        // they're using for the editor to focus the editor.
        onClick={(evt) => {
          // Only do this when root container of the editor is clicked (not
          // something inside it)
          if (evt.target === containerRef.current) {
            editorRef.current?.focus();
          }
        }}
      >
        {/* Separate scrollable container for editor so that action buttons can */}
        {/* stay in one place when scrolling */}
        <BaseEditor
          ref={editorRef}
          className={editorClassName}
          language="javascript-expression"
          minLines={10}
          {...props}
        ></BaseEditor>
        {hasActions && (
          <ActionsContainer
            onExpand={onExpand}
            expanded={expanded}
            copyable={copyable}
            formattable={formattable}
            editorRef={editorRef}
            className={actionsClassName}
            customActions={customActions}
          />
        )}
      </div>
    );
  }
);

/**
 * Sets the editor value, use this with RTL like this:
 *
 * ```
 * render(<Editor data-testid='my-editor' />);
 * setCodemirrorEditorValue(screen.getByTestId('editor-test-id'), 'my text');
 * ```
 */
async function setCodemirrorEditorValue(
  element: Element | string | null,
  text: string
): Promise<void> {
  if (typeof element === 'string') {
    element = document.querySelector<HTMLElement>(`[data-testid="${element}"]`);
  }
  if (!element || !element.hasAttribute('data-codemirror')) {
    throw new Error('Cannot find editor container');
  }
  const editorView = (element as HTMLElement & { _cm: EditorView })._cm;
  await scheduleDispatch(editorView, {
    changes: {
      from: 0,
      to: editorView.state.doc.length,
      insert: text,
    },
  });
}

/**
 * Retrieves the contents of an editor, use this with RTL like this:
 *
 * ```
 * render(<Editor data-testid='my-editor' />);
 * getCodemirrorEditorValue(screen.getByTestId('editor-test-id'));
 * ```
 */
function getCodemirrorEditorValue(element: Element | string | null): string {
  if (typeof element === 'string') {
    element = document.querySelector<HTMLElement>(`[data-testid="${element}"]`);
  }
  const editorView = (element as any)?._cm ?? (element as any)?.cmView?.view;
  if (!editorView) {
    throw new Error('Cannot find editor container');
  }
  return getEditorContents(editorView);
}

export { BaseEditor };
export { InlineEditor as CodemirrorInlineEditor };
export { MultilineEditor as CodemirrorMultilineEditor };
export { setCodemirrorEditorValue };
export { getCodemirrorEditorValue };
export type { CompletionSource as Completer };
export { highlightStyles };
