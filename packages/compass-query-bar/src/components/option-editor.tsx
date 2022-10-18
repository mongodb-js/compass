import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  css,
  cx,
  useFocusRing,
  palette,
  spacing,
} from '@mongodb-js/compass-components';
import type { Listenable } from 'reflux';
import type {
  AceEditor,
  CompletionWithServerInfo,
} from '@mongodb-js/compass-editor';
import {
  Editor,
  EditorTextCompleter,
  QueryAutoCompleter,
} from '@mongodb-js/compass-editor';

import type { QueryOption as QueryOptionType } from '../constants/query-option-definition';

const editorStyles = css({
  width: '100%',
  minWidth: spacing[7],
  // To match ace editor with leafygreen inputs.
  paddingTop: '5px',
  paddingBottom: '5px',
  paddingLeft: '10px',
  paddingRight: '2px',
  border: '1px solid transparent',
  borderRadius: spacing[1],
  overflow: 'visible',
});

const editorWithErrorStyles = css({
  borderColor: palette.red.base,
  '&:focus-within': {
    borderColor: palette.gray.base,
  },
});

const editorSettings = {
  minLines: 1,
  maxLines: 10,
};

function disableEditorCommand(editor: AceEditor, name: string) {
  const command = editor.commands.byName[name];
  command.bindKey = undefined;
  editor.commands.addCommand(command);
}

type OptionEditorProps = {
  hasError: boolean;
  id: string;
  onChange: (value: string) => void;
  onApply: () => void;
  placeholder?: string;
  queryOption: QueryOptionType;
  refreshEditorAction: Listenable;
  schemaFields?: CompletionWithServerInfo[];
  serverVersion?: string;
  value?: string;
};

function useQueryCompleter(
  ...args: ConstructorParameters<typeof QueryAutoCompleter>
): QueryAutoCompleter {
  const [version, textCompleter, fields] = args;
  const completer = useRef<QueryAutoCompleter>();
  if (!completer.current) {
    completer.current = new QueryAutoCompleter(version, textCompleter, fields);
  }
  useEffect(() => {
    completer.current?.update(fields);
  }, [fields]);
  return completer.current;
}

export const OptionEditor: React.FunctionComponent<OptionEditorProps> = ({
  hasError,
  id,
  onChange,
  onApply,
  placeholder,
  refreshEditorAction,
  schemaFields = [],
  serverVersion = '3.6.0',
  value = '',
}) => {
  const focusRingProps = useFocusRing({
    outer: true,
    focusWithin: true,
    hover: true,
  });

  const completer = useQueryCompleter(
    serverVersion,
    EditorTextCompleter,
    schemaFields
  );

  const editorRef = useRef<AceEditor | undefined>(undefined);

  useEffect(() => {
    const unsubscribeRefreshEditorAction = refreshEditorAction.listen(() => {
      // Ace editor does not update the value of the editor when
      // the container is not displayed (display: 'none').
      // As a result, we currently listen for `subtab-changed` events
      // which call this `refreshEditor` action. Then we perform a full ace
      // update editor update to ensure the value is updated
      // when the container is displayed, so that any changes to the query
      // are reflected.
      // More info https://github.com/securingsincity/react-ace/issues/204
      editorRef.current?.renderer.updateFull();
    });

    return () => {
      unsubscribeRefreshEditorAction();
    };
  }, [refreshEditorAction]);

  const commands = useMemo(() => {
    return [
      {
        name: 'executeQuery',
        bindKey: {
          win: 'Enter',
          mac: 'Enter',
        },
        exec: () => {
          onApply();
        },
      },
    ];
  }, [onApply]);

  const onLoadEditor = useCallback((editor: AceEditor) => {
    editorRef.current = editor;
    editorRef.current.setBehavioursEnabled(true);

    // Disable the default tab key handlers. COMPASS-4900
    // This for accessibility so that users can tab navigate through Compass.
    // Down the line if folks want tab functionality we can keep
    // these commands enabled and disable them with the `Escape` key.
    disableEditorCommand(editor, 'indent');
    disableEditorCommand(editor, 'outdent');
  }, []);

  return (
    <div
      className={cx(
        editorStyles,
        focusRingProps.className,
        hasError && editorWithErrorStyles
      )}
    >
      <Editor
        variant="Shell"
        text={value}
        onChangeText={onChange}
        id={id}
        options={editorSettings}
        completer={completer}
        placeholder={placeholder}
        onLoad={onLoadEditor}
        commands={commands}
        inline
      />
    </div>
  );
};

export default OptionEditor;
