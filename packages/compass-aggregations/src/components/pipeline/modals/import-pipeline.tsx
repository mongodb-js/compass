import React, { useEffect, useRef } from 'react';
import { FormModal } from '@mongodb-js/compass-components';
import type { CompletionWithServerInfo } from '@mongodb-js/compass-editor';
import {
  Editor,
  EditorVariant,
  EditorTextCompleter,
  AggregationAutoCompleter
} from '@mongodb-js/compass-editor';
import {
  changeText,
  closeImport,
  createNew
} from '../../../modules/import-pipeline';
import type { RootState } from '../../../modules';
import styles from './import-pipeline.module.less';
import { connect } from 'react-redux';

function useAggregationCompleter(
  ...args: ConstructorParameters<typeof AggregationAutoCompleter>
): AggregationAutoCompleter {
  const [version, textCompleter, fields] = args;
  const completer = useRef<AggregationAutoCompleter>();
  if (!completer.current) {
    completer.current = new AggregationAutoCompleter(
      version,
      textCompleter,
      fields
    );
  }
  useEffect(() => {
    completer.current?.updateFields(fields);
  }, [fields]);
  return completer.current;
}

export const ImportPipeline: React.FunctionComponent<{
  isOpen?: boolean;
  closeImport(): void;
  changeText(newText: string): void;
  createNew(): void;
  text: string;
  error?: string | null;
  fields: CompletionWithServerInfo[];
  serverVersion: string;
}> = ({
  isOpen,
  createNew,
  closeImport,
  text,
  changeText,
  error,
  fields,
  serverVersion
}) => {
  const completer = useAggregationCompleter(
    serverVersion,
    EditorTextCompleter,
    fields
  );

  return (
    <FormModal
      title="New Pipeline From Plain Text"
      open={isOpen}
      onSubmit={createNew}
      onCancel={closeImport}
      submitButtonText="Create New"
      submitDisabled={text === ''}
      trackingId="import_pipeline_modal"
      data-testid="import-pipeline-modal"
    >
      <div className={styles['import-pipeline-note']}>
        Supports MongoDB Shell syntax. Pasting a pipeline will create a new
        pipeline.
      </div>
      <div className={styles['import-pipeline-editor']}>
        <Editor
          variant={EditorVariant.Shell}
          text={text}
          onChangeText={changeText}
          options={{ minLines: 10 }}
          completer={completer}
          name="import-pipeline-editor"
        />
      </div>
      {error && <div className={styles['import-pipeline-error']}>{error}</div>}
    </FormModal>
  );
};

const mapState = (state: RootState) => {
  return {
    isOpen: state.importPipeline.isOpen,
    text: state.importPipeline.text,
    error: state.importPipeline.syntaxError,
    fields: state.fields,
    serverVersion: state.serverVersion
  };
};

const mapDispatch = {
  closeImport,
  changeText,
  createNew
};

export default connect(mapState, mapDispatch)(ImportPipeline);
