import React, { useEffect, useRef } from 'react';

if (typeof window === 'undefined' && typeof globalThis !== 'undefined') {
  // ace-builds wants to install itself on `window`, which
  // is not available when this package is loaded through
  // (non-Electron) Node.js. That's an atypical case, but it's
  // easier to account for it here than to handle all cases
  // in which this package is loaded from Node.js.
  (globalThis as any).window = {};
}

import 'ace-builds';
import type { IAceEditorProps, IAceOptions } from 'react-ace';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-csharp';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-java';
import 'ace-builds/src-noconflict/mode-ruby';
import 'ace-builds/src-noconflict/mode-rust';
import 'ace-builds/src-noconflict/mode-golang';
import 'mongodb-ace-mode';
import 'mongodb-ace-theme';
import 'mongodb-ace-theme-query';
import tools from 'ace-builds/src-noconflict/ext-language_tools';

/**
 * Options for the ACE editor.
 */
const DEFAULT_OPTIONS: IAceOptions = {
  enableLiveAutocompletion: false,
  tabSize: 2,
  fontSize: 11,
  minLines: 10,
  maxLines: Infinity,
  showGutter: true,
  useWorker: false,
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
  onChangeText?: (text: string, event?: any) => void;
} & Omit<IAceEditorProps, 'onChange' | 'value'>;

function Editor({
  text,
  variant,
  options,
  readOnly,
  id,
  onChangeText,
  completer,
  onFocus,
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

  useEffect(() => {
    if (id && editorRef.current) {
      // After initial load, assign the id to the text area used by ace.
      // This is so labels can `htmlFor` the input.
      editorRef.current.editor.textInput.getElement().id = id;
    }
  }, [id]);

  return (
    <AceEditor
      ref={ref => editorRef.current = ref}
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
      {...aceProps}
      onFocus={(ev: any) => {
        if (completer) {
          tools.setCompleters([completer]);
        }
        onFocus?.(ev);
      }}
    />
  );
}

const EditorTextCompleter = tools.textCompleter;
export { Editor, EditorVariant, EditorTextCompleter };
