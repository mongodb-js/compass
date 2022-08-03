import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { QueryAutoCompleter } from 'mongodb-ace-autocompleter';
import {
  Editor,
  EditorVariant,
  EditorTextCompleter,
  css,
  cx,
  focusRingStyles,
  focusRingVisibleStyles,
  uiColors,
  spacing,
} from '@mongodb-js/compass-components';
import type { Listenable } from 'reflux';
import type { Ace } from 'ace-builds';

import type { QueryOption as QueryOptionType } from '../constants/query-option-definition';

const editorStyles = cx(
  focusRingStyles,
  css({
    minWidth: spacing[7],
    '&::after': {
      position: 'absolute',
      content: '""',
      pointerEvents: 'none',
      top: -1,
      right: -1,
      bottom: -1,
      left: -1,
      borderRadius: spacing[1],
      transition: 'box-shadow .16s ease-in',
      boxShadow: '0 0 0 0 transparent',
    },
    border: `1px solid ${uiColors.gray.light2}`,
    borderRadius: '4px',
    overflow: 'visible',
    background: uiColors.white,
    '&:hover': {
      '&::after': {
        boxShadow: `0 0 0 3px ${uiColors.gray.light2}`,
        transitionTimingFunction: 'ease-out',
      },
    },
    '&:focus-within': focusRingVisibleStyles,
  })
);

const editorWithErrorStyles = css({
  borderColor: uiColors.red.base,
  '&:focus-within': {
    borderColor: uiColors.gray.base,
  },
});

const editorSettings = {
  useSoftTabs: true,
  minLines: 1,
  maxLines: 10,
  fontSize: 12,
  highlightActiveLine: false,
  showGutter: false,
};

type OptionEditorProps = {
  hasError: boolean;
  id: string;
  onChange: (value: string) => void;
  onApply: () => void;
  placeholder?: string;
  queryOption: QueryOptionType;
  refreshEditorAction: Listenable;
  schemaFields?: string[];
  serverVersion?: string;
  value?: string;
};

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
  const completer = useRef<typeof QueryAutoCompleter>(
    new QueryAutoCompleter(serverVersion, EditorTextCompleter, schemaFields)
  );

  const editorRef = useRef<Ace.Editor | undefined>(undefined);

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

  useLayoutEffect(() => {
    completer.current.update(schemaFields);
  }, [schemaFields]);

  const onApplyClicked = useCallback(() => onApply(), [onApply]);
  const onApplyRef = useRef(onApplyClicked);
  onApplyRef.current = onApplyClicked;

  const onLoadEditor = useCallback((editor: Ace.Editor) => {
    editorRef.current = editor;
    editorRef.current.setBehavioursEnabled(true);
    editorRef.current.commands.addCommand({
      name: 'executeQuery',
      bindKey: {
        win: 'Enter',
        mac: 'Enter',
      },
      exec: () => {
        onApplyRef.current();
      },
    });
  }, []);

  return (
    <Editor
      variant={EditorVariant.Shell}
      className={cx(editorStyles, hasError && editorWithErrorStyles)}
      theme="mongodb-query"
      text={value}
      onChangeText={(value) => onChange(value)}
      id={id}
      options={editorSettings}
      completer={completer.current}
      placeholder={placeholder}
      fontSize={12}
      scrollMargin={[6, 6, 0, 0]}
      onLoad={onLoadEditor}
    />
  );
};

export default OptionEditor;
