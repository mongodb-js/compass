import React, { useLayoutEffect, useMemo, useRef } from 'react';
import {
  css,
  useId,
  fontFamilies,
  useDarkMode,
} from '@mongodb-js/compass-components';

import 'ace-builds';
import type { IAceEditorProps, IAceOptions, ICommand } from 'react-ace';
import AceEditor from 'react-ace';
// TODO(COMPASS-6117): Re-enable so that we can use ace workers
// import 'ace-builds/webpack-resolver';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-csharp';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-java';
import 'ace-builds/src-noconflict/mode-ruby';
import 'ace-builds/src-noconflict/mode-rust';
import 'ace-builds/src-noconflict/mode-golang';
import 'ace-builds/src-noconflict/mode-php';
import tools from 'ace-builds/src-noconflict/ext-language_tools';
import './ace';
import { prettify } from './prettify';

/**
 * Options for the ACE editor.
 */
const DEFAULT_OPTIONS: IAceOptions = {
  enableLiveAutocompletion: false,
  tabSize: 2,
  minLines: 10,
  maxLines: Infinity,
  showGutter: true,
  showPrintMargin: false,
  useWorker: false,
  // NB: font styles have to be set through ace options, setting them through
  // the theme (or just css) has no effect on the ace editor. This is especially
  // important for font size that ace uses for multiple internal calculations.
  // At the same time line-height, that is also used internally, can not be set
  // through options and needs to be provided as a style on the container
  // element
  fontFamily: fontFamilies.code,
  fontSize: 13,
};

const EditorVariant = {
  Shell: 'Shell',
  EJSON: 'EJSON',
  Generic: 'Generic',
} as const;

export type EditorProps = {
  variant: keyof typeof EditorVariant;
  text?: string;
  id?: string;
  options?: Omit<
    IAceOptions,
    'readOnly' | 'fontFamily' | 'fontSize' | 'enableLiveAutocompletion'
  >;
  readOnly?: boolean;
  completer?: unknown;
  'data-testid'?: string;
  onChangeText?: (text: string, event?: any) => void;
  darkMode?: boolean;
} & Omit<IAceEditorProps, 'onChange' | 'value' | 'theme'>;

const editorStyle = css({
  position: 'relative',
  width: '100%',
  zIndex: 0,
});

const defaultCommands: ICommand[] = [
  {
    name: 'prettify',
    exec(editor) {
      try {
        const code = prettify(editor.getValue());
        const currentSelection = editor.selection.toJSON();
        editor.session.doc.setValue(code);
        // Setting value moves cursor to the end of the editor, we will try to
        // set it back to where it was setting selection directly (using
        // `moveCursorTo` method can select text which is not desireable)
        editor.selection.fromJSON(currentSelection);
      } catch {
        // failed to parse, do nothing
      }
    },
    bindKey: {
      win: 'Ctrl-Shift-B',
      mac: 'Ctrl-Shift-B',
    },
  },
  {
    name: 'copy-all',
    exec(editor) {
      void navigator.clipboard.writeText(editor.getValue());
    },
    bindKey: {
      win: 'Ctrl-Shift-C',
      mac: 'Ctrl-Shift-C',
    },
  },
];

function BaseEditor({
  text,
  variant,
  options,
  readOnly,
  id,
  name,
  commands: _commands,
  onChangeText,
  completer,
  'data-testid': dataTestId,
  onFocus,
  darkMode: _darkMode,
  ...aceProps
}: EditorProps): React.ReactElement {
  const setOptions: IAceOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
    ...(typeof readOnly === 'boolean' && { readOnly }),
    ...(variant === 'Shell' && { mode: 'ace/mode/mongodb' }),
    ...(!!completer && { enableLiveAutocompletion: true }),
  };

  const editorRef = useRef<AceEditor | null>(null);
  const providerDarkMode = useDarkMode();
  const darkMode = _darkMode ?? providerDarkMode;

  useLayoutEffect(() => {
    if (!editorRef.current) {
      return;
    }
    // See comment in theme.ts for why we are using a second theme for dark mode
    editorRef.current.editor.setTheme(
      `ace/theme/${darkMode ? 'mongodb-dark' : 'mongodb'}`
    );
  }, [darkMode]);

  useLayoutEffect(() => {
    if (id && editorRef.current) {
      // After initial load, assign the id to the text area used by ace.
      // This is so labels can `htmlFor` the input.
      (editorRef.current.editor.textInput as any).getElement().id = id;
    }
  }, [id]);

  const editorName = useId();

  const commands = useMemo(() => {
    return defaultCommands.concat(_commands ?? []);
  }, [_commands]);

  return (
    <div data-testid={dataTestId} className={editorStyle}>
      <AceEditor
        ref={editorRef}
        mode={
          variant === 'Generic'
            ? undefined
            : variant === 'EJSON'
            ? 'json'
            : 'javascript' // set to 'mongodb' as part of setOptions
        }
        width="100%"
        value={text}
        onChange={(...args) => {
          console.log('on change');
          onChangeText?.(...args);
        }}
        editorProps={{ $blockScrolling: Infinity }}
        setOptions={setOptions}
        readOnly={readOnly}
        // name should be unique since it gets translated to an id
        name={name ?? editorName}
        commands={commands}
        onFocus={(ev: any) => {
          if (completer) {
            tools.setCompleters([completer]);
          }
          onFocus?.(ev);
        }}
        {...aceProps}
      />
    </div>
  );
}

/**
 * Sets the editor value, use this with RTL like this:
 *
 * ```
 * render(<Editor data-testid='my-editor' />);
 * setEditorValue(screen.getByTestId('editor-test-id'), 'my text');
 * ```
 */
function setEditorValue(element: HTMLElement, value: string): void {
  const container = element.querySelector('.ace_editor');
  if (!container) {
    throw new Error('Cannot find editor container');
  }
  (window as any).ace
    .edit(element.querySelector(`#${container.id}`))
    .setValue(value);
}

const EditorTextCompleter = tools.textCompleter;

// TODO: Editor export should become an Editor with a CodeFrame after COMPASS-6243
export {
  BaseEditor as Editor,
  EditorVariant,
  EditorTextCompleter,
  setEditorValue,
};
