import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import type { RootState } from '../../stores';
import { changeFieldValue } from '../../stores/settings';
import type { EDITOR } from 'compass-preferences-model';
import {
  FormFieldContainer,
  Icon,
  css,
  spacing,
  RadioBoxGroup,
  RadioBox,
  Label,
} from '@mongodb-js/compass-components';

const radioBoxStyles = css({
  div: {
    textAlign: 'left',
    padding: spacing[3],
    justifyContent: 'flex-start',
  },
});

const iconStyles = css({
  marginRight: spacing[3],
});

type EditorSettingsProps = {
  handleChange: (field: 'editor', value: EDITOR) => void;
  editorValue: EDITOR;
};

export const EditorSettings: React.FunctionComponent<EditorSettingsProps> = ({
  handleChange,
  editorValue,
}) => {
  const handleSelectorChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleChange('editor', event.target.value as EDITOR);
    },
    [handleChange]
  );

  return (
    <div data-testid="editor-settings">
      <div>Change the Editor settings.</div>

      <FormFieldContainer>
        <Label id="editor-selector-label">
          Select the Editor default appearance.
        </Label>
      </FormFieldContainer>
      <FormFieldContainer>
        <RadioBoxGroup
          id="editor-selector"
          onChange={handleSelectorChange}
          value={editorValue}
          size="full"
        >
          <RadioBox
            id="editor-selector-list"
            data-testid="editor-selector-list"
            className={radioBoxStyles}
            value="List"
          >
            <Icon className={iconStyles} glyph="Menu" />
            List
          </RadioBox>
          <RadioBox
            id="editor-selector-json"
            data-testid="editor-selector-json"
            className={radioBoxStyles}
            value="JSON"
          >
            <Icon className={iconStyles} glyph="CurlyBraces" />
            JSON
          </RadioBox>
          <RadioBox
            id="editor-selector-table"
            data-testid="editor-selector-table"
            className={radioBoxStyles}
            value="Table"
          >
            <Icon className={iconStyles} glyph="Table" />
            Table
          </RadioBox>
        </RadioBoxGroup>
      </FormFieldContainer>
    </div>
  );
};

const mapState = ({ settings: { settings } }: RootState) => ({
  editorValue: settings.editor,
});

const mapDispatch = {
  handleChange: changeFieldValue,
};

export default connect(mapState, mapDispatch)(EditorSettings);
