import React, { useMemo, useRef } from 'react';
import {
  css,
  cx,
  useFocusRing,
  palette,
  spacing,
} from '@mongodb-js/compass-components';
import type {
  Command,
  CompletionWithServerInfo,
} from '@mongodb-js/compass-editor';
import {
  CodemirrorInlineEditor as InlineEditor,
  createQueryAutocompleter,
} from '@mongodb-js/compass-editor';
import { connect } from 'react-redux';
import type { QueryBarState } from '../stores/query-bar-reducer';

const editorStyles = css({
  width: '100%',
  minWidth: spacing[7],
  // To match codemirror editor with leafygreen inputs.
  paddingTop: 1,
  paddingBottom: 1,
  paddingLeft: 4,
  paddingRight: 0,
  border: '1px solid transparent',
  borderRadius: spacing[1],
  overflow: 'visible',
});

const editorWithErrorStyles = css({
  '&:after': {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    zIndex: 2,
    borderRadius: spacing[1],
    border: `1px solid ${palette.red.base}`,
    pointerEvents: 'none',
  },
  '&:focus-within': {
    borderColor: palette.gray.base,
  },
});

type OptionEditorProps = {
  hasError: boolean;
  id: string;
  onChange: (value: string) => void;
  onApply?(): void;
  placeholder?: string;
  schemaFields?: CompletionWithServerInfo[];
  serverVersion?: string;
  value?: string;
  ['data-testid']?: string;
};

const OptionEditor: React.FunctionComponent<OptionEditorProps> = ({
  hasError,
  id,
  onChange,
  onApply,
  placeholder,
  schemaFields = [],
  serverVersion = '3.6.0',
  value = '',
  ['data-testid']: dataTestId,
}) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const focusRingProps = useFocusRing({
    outer: true,
    focusWithin: true,
    hover: true,
  });

  const onApplyRef = useRef(onApply);
  onApplyRef.current = onApply;

  const commands = useMemo<Command[]>(() => {
    return [
      {
        key: 'Enter',
        run() {
          onApplyRef.current?.();
          return true;
        },
        preventDefault: true,
      },
    ];
  }, []);

  const completer = useMemo(() => {
    return createQueryAutocompleter({
      fields: schemaFields
        .filter(
          (field): field is { name: string } & CompletionWithServerInfo =>
            !!field.name
        )
        .map((field) => ({
          name: field.name,
          description: field.description,
        })),
      serverVersion,
    });
  }, [schemaFields, serverVersion]);

  return (
    <div
      className={cx(
        editorStyles,
        focusRingProps.className,
        hasError && editorWithErrorStyles
      )}
      ref={editorContainerRef}
    >
      <InlineEditor
        id={id}
        text={value}
        onChangeText={onChange}
        placeholder={placeholder}
        completer={completer}
        commands={commands}
        data-testid={dataTestId}
      />
    </div>
  );
};

const ConnectedOptionEditor = connect((state: QueryBarState) => {
  return {
    schemaFields: state.schemaFields as CompletionWithServerInfo[],
    serverVersion: state.serverVersion,
  };
})(OptionEditor);

export default ConnectedOptionEditor;
