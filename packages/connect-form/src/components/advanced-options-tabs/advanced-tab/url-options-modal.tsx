import React, { ChangeEvent, KeyboardEvent } from 'react';
import { css } from '@emotion/css';
import {
  spacing,
  uiColors,
  Button,
  Modal,
  H3,
  TextInput,
  FormFooter,
  Select,
  Option,
  OptionGroup,
} from '@mongodb-js/compass-components';

import FormFieldContainer from '../../form-field-container';
import { editableUrlOptions, UrlOption } from '../../../utils/url-options';

const modalContainerStyles = css({
  padding: 0,
  'button[aria-label="Close modal"]': {
    position: 'absolute',
  },
});

const modalContentStyles = css({
  padding: spacing[5],
});

const modalFooterStyles = css({
  boxShadow: 'none',
  border: 'none',
  borderTop: `1px solid ${uiColors.gray.light2}`,
});

function UrlOptionsModal({
  onClose,
  selectedOption,
  onUpdateOption,
}: {
  onClose: (isOpen: boolean) => void;
  onUpdateOption: (option: UrlOption) => void;
  selectedOption?: UrlOption;
}): React.ReactElement {
  const [errorMessage, setErrorMessage] = React.useState('');
  const [option, setOption] = React.useState(
    selectedOption ?? { key: '', value: '' }
  );

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addUrlOption();
    }
  };

  const addUrlOption = () => {
    setErrorMessage('');
    if (!option.key) {
      return setErrorMessage('Please select an options key.');
    }
    onUpdateOption(option as UrlOption);
  };

  return (
    <Modal
      contentClassName={modalContainerStyles}
      open={true}
      setOpen={onClose}
      data-testid='uri-options-modal'
    >
      <div className={modalContentStyles}>
        <H3>Add custom url option</H3>
        <FormFieldContainer>
          <Select
            data-testid="uri-options-key-field"
            label="Key"
            placeholder="Select key"
            name="key"
            onChange={(key) => {
              setOption({
                key: key as UrlOption['key'],
                value: option.value,
              });
            }}
            allowDeselect={false}
            value={option.key}
          >
            {editableUrlOptions.map(({ title, values }) => (
              <OptionGroup key={title} label={title}>
                {values.map((value) => (
                  <Option key={value} value={value}>
                    {value}
                  </Option>
                ))}
              </OptionGroup>
            ))}
          </Select>
        </FormFieldContainer>
        <FormFieldContainer>
          <TextInput
            onChange={({
              target: { value },
            }: ChangeEvent<HTMLInputElement>) => {
              setOption({
                key: option.key,
                value,
              });
            }}
            name={'value'}
            data-testid="uri-options-value-field"
            label={'Value'}
            type={'text'}
            placeholder={'Value'}
            value={option.value}
            onKeyDown={handleKeyPress}
          />
        </FormFieldContainer>
      </div>
      <FormFooter
        className={modalFooterStyles}
        errorMessage={errorMessage}
        primaryButton={
          <Button data-testid="uri-options-save-button" variant={'primary'} onClick={() => addUrlOption()}>
            Save
          </Button>
        }
        onCancel={() => onClose(false)}
      />
    </Modal>
  );
}

export default UrlOptionsModal;
