import React, { useLayoutEffect, useRef } from 'react';
import { css, useId, fontFamilies } from '@mongodb-js/compass-components';

import 'ace-builds';
import type { IAceEditorProps, IAceOptions } from 'react-ace';
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
import './ace/mode';
import './ace/theme';
import tools from 'ace-builds/src-noconflict/ext-language_tools';
import beautify from 'ace-builds/src-noconflict/ext-beautify';

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
  fontFamily: fontFamilies.code,
  fontSize: 13,
  lineHeight: '16px',
};

const EditorVariant = {
  Shell: 'Shell',
  EJSON: 'EJSON',
  Generic: 'Generic',
} as const;

type EditorProps = {
  variant: keyof typeof EditorVariant;
  text?: string;
  id?: string;
  options?: Omit<IAceOptions, 'readOnly'>;
  readOnly?: boolean;
  completer?: unknown;
  'data-testid'?: string;
  onChangeText?: (text: string, event?: any) => void;
} & Omit<IAceEditorProps, 'onChange' | 'value'>;

const editorStyle = css({
  position: 'relative',
  width: '100%',
  zIndex: 0,
});

function Editor({
  text,
  variant,
  options,
  readOnly,
  id,
  onChangeText,
  completer,
  onFocus,
  'data-testid': dataTestId,
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

  useLayoutEffect(() => {
    if (id && editorRef.current) {
      // After initial load, assign the id to the text area used by ace.
      // This is so labels can `htmlFor` the input.
      (editorRef.current.editor.textInput as any).getElement().id = id;
    }
  }, [id]);

  const editorName = useId();

  return (
    <div data-testid={dataTestId} className={editorStyle}>
      <AceEditor
        ref={(ref) => (editorRef.current = ref)}
        mode={
          variant === 'Generic'
            ? undefined
            : variant === 'EJSON'
            ? 'json'
            : 'javascript' // set to 'mongodb' as part of setOptions
        }
        theme="mongodb"
        width="100%"
        value={text}
        onChange={onChangeText}
        editorProps={{ $blockScrolling: Infinity }}
        setOptions={setOptions}
        readOnly={readOnly}
        commands={beautify.commands}
        // name should be unique since it gets translated to an id
        name={aceProps.name ?? editorName}
        {...aceProps}
        onFocus={(ev: any) => {
          if (completer) {
            tools.setCompleters([completer]);
          }
          onFocus?.(ev);
        }}
      />
    </div>
  );
}

/**
 * Sets the editor value, use this with RTL like this:
 *
 * ```
 * render(<Editor data-testid='my-editor' />);
 * Editor.setEditorValue(screen.getByTestId('editor-test-id'), 'my text');
 * ```
 */
function setEditorValue(element: HTMLElement, value: string): void {
  const container = element.querySelector('.ace_editor');
  if (!container) {
    throw new Error('Cannot find editor container');
  }
  (window as any).ace.edit(container.id).setValue(value);
}

const EditorTextCompleter = tools.textCompleter;

export { Editor, EditorVariant, EditorTextCompleter, setEditorValue };
