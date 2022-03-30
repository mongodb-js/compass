import React from 'react';
import type { Document } from 'mongodb';
import {
  encryptedFieldConfigToText,
  textToEncryptedFieldConfig,
} from '../../../utils/csfle-handler';
import { Label, Banner, Description, css, spacing } from '@mongodb-js/compass-components';

import 'ace-builds';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'mongodb-ace-mode';
import 'mongodb-ace-theme';

const errorContainerStyles = css({
  padding: spacing[3],
  width: '100%',
});

/**
 * Options for the ACE editor.
 */
const OPTIONS = {
  enableLiveAutocompletion: false,
  tabSize: 2,
  fontSize: 11,
  minLines: 10,
  maxLines: Infinity,
  showGutter: true,
  useWorker: false,
  mode: 'ace/mode/mongodb',
};

function EncryptedFieldConfigInput({
  encryptedFieldConfig,
  errorMessage,
  onChange,
}: {
  encryptedFieldConfig: Document | undefined;
  errorMessage: string | undefined;
  onChange: (value: Document | undefined) => void;
}): React.ReactElement {
  function changeCurrentText(newText: string) {
    if (!newText.trim()) {
      onChange(undefined);
      return;
    }

    onChange(textToEncryptedFieldConfig(newText));
  }

  const currentText = encryptedFieldConfig
    ? encryptedFieldConfigToText(encryptedFieldConfig)
    : '';

  return (
    <div>
      <Label htmlFor="TODO">EncryptedFieldConfigMap</Label>
      <Description>Add an optional client-side EncryptedFieldConfigMap for enhanced security.</Description>
      <AceEditor
        mode="javascript" // will be set to mongodb as part of OPTIONS
        theme="mongodb"
        width="100%"
        value={currentText}
        onChange={changeCurrentText}
        editorProps={{ $blockScrolling: Infinity }}
        name="import-pipeline-editor"
        setOptions={OPTIONS}
      />
      {
        errorMessage && (
          <div className={errorContainerStyles}>
            <Banner variant="danger">{errorMessage}</Banner>
          </div>
        )
      }
    </div>
  );
}

export default EncryptedFieldConfigInput;
