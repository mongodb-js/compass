import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import {
  CodemirrorMultilineEditor,
  createDocumentAutocompleter,
  createQueryAutocompleter,
} from '@mongodb-js/compass-editor';
import { useAutocompleteFields } from '@mongodb-js/compass-field-store';
import type { RootState } from '../../modules';
import type { CodeOptions } from '../../modules/create-index';

type CodeFieldEditorProps = {
  name: CodeOptions;
  value: string;
  disabled?: boolean;
  onChange(name: string, newVal: string): void;
  namespace: string;
  serverVersion: string;
};

const CodeFieldEditor: React.FunctionComponent<CodeFieldEditorProps> = ({
  name,
  value,
  disabled,
  onChange,
  namespace,
  serverVersion,
}) => {
  const id = `create-index-modal-${name}`;
  const inputId = `${id}-code`;

  const schemaFields = useAutocompleteFields(namespace);
  const fields = useMemo(
    () => schemaFields.map((field) => field.name),
    [schemaFields]
  );

  const completer = useMemo(() => {
    switch (name) {
      case 'partialFilterExpression':
        return createQueryAutocompleter({ fields, serverVersion });
      default:
        return createDocumentAutocompleter(fields);
    }
  }, [name, fields, serverVersion]);

  return (
    <CodemirrorMultilineEditor
      data-testid={inputId}
      text={value}
      onChangeText={(newVal) => {
        onChange(name, newVal);
      }}
      id={inputId}
      aria-labelledby={id}
      readOnly={disabled}
      completer={completer}
    />
  );
};

export default connect((state: RootState) => ({
  namespace: state.namespace,
  serverVersion: state.serverVersion,
}))(CodeFieldEditor);
