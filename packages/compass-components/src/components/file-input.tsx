import React from 'react';
import path from 'path';
import { css, cx } from '@leafygreen-ui/emotion';
import { uiColors } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';

import { Button, Icon, Label, Link, Description } from '..';

const { base: redBaseColor } = uiColors.red;

const formItemHorizontalStyles = css({
  marginTop: spacing[2],
  marginBottom: spacing[2],
  marginRight: 'auto',
  marginLeft: 'auto',
  display: 'flex',
  alignItems: 'center',
});

const formItemVerticalStyles = css`
  margin: 5px auto 20px;
`;

const formItemErrorStyles = css`
  border: 1px solid ${redBaseColor};
  border-radius: 5px;
  &:focus {
    border: 1px solid ${redBaseColor};
  }
`;

const buttonStyles = css`
  width: 100%;
`;

const errorMessageStyles = css({
  color: `${redBaseColor} !important`,
});

const labelHorizontalStyles = css({
  width: '70%',
  display: 'grid',
  gridTemplateAreas: `'label icon' 'description .'`,
  gridTemplateColumns: '1fr auto',
  alignItems: 'center',
  columnGap: spacing[1],
  paddingRight: spacing[3],
});

const labelIconStyles = css`
  display: inline-block;
  vertical-align: middle;
  font: normal normal normal 14px/1 FontAwesome;
  font-size: inherit;
  text-rendering: auto;
  margin: 0 0 0 5px;
  cursor: pointer;
  color: #bfbfbe;

  &:link,
  &:active {
    color: #bfbfbe;
  }

  &:link,
  &:active,
  &:hover {
    text-decoration: none;
  }

  &:hover {
    color: #fbb129;
  }
`;

export enum Variant {
  Horizontal = 'HORIZONTAL',
  Vertical = 'VERTICAL',
}

// https://www.electronjs.org/docs/latest/api/file-object
type FileWithPath = File & {
  /** Electron-specific property that contains an absolute path to the file */
  path: string;
};

function FileInput({
  id,
  label,
  dataTestId,
  onChange,
  multi = false,
  error = false,
  errorMessage,
  variant = Variant.Horizontal,
  link,
  description,
  values,
  labelAlignment = 'left',
}: {
  id: string;
  label: string;
  dataTestId: string;
  onChange: (files: string[]) => void;
  multi?: boolean;
  error?: boolean;
  errorMessage?: string;
  variant?: Variant;
  link?: string;
  description?: string;
  values?: string[];
  labelAlignment?: 'right' | 'left' | 'center';
}): React.ReactElement {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const buttonText = React.useMemo(() => {
    if (Array.isArray(values) && values.length > 0) {
      return values.map((file) => path.basename(file)).join(', ');
    }

    return multi ? 'Select files...' : 'Select a file...';
  }, [values, multi]);

  const onFilesChanged = React.useCallback(
    (evt) => {
      const fileList = Array.from(evt.currentTarget.files as FileList);
      const files = fileList.map((file) => {
        return (file as FileWithPath).path;
      });
      onChange(files);
    },
    [onChange]
  );

  const renderDescription = () => {
    if (!link && !description) {
      return <></>;
    }
    if (!link) {
      return (
        <Description
          data-testid={'file-input-description'}
          style={{ gridArea: 'description' }}
        >
          {description}
        </Description>
      );
    }
    return (
      <Link
        data-testid={'file-input-link'}
        href={link}
        className={cx(
          {
            [labelIconStyles]: !description,
          },
          css({
            gridArea: description ? 'description' : 'icon',
          })
        )}
        hideExternalIcon={!description}
      >
        {description ?? ''}
      </Link>
    );
  };

  return (
    <div>
      <div
        className={cx(
          { [formItemHorizontalStyles]: variant === Variant.Horizontal },
          { [formItemVerticalStyles]: variant === Variant.Vertical },
          { [formItemErrorStyles]: error }
        )}
      >
        <label
          htmlFor={`${id}_file_input`}
          className={cx(
            { [labelHorizontalStyles]: variant === Variant.Horizontal },
            css({
              textAlign: labelAlignment,
            })
          )}
        >
          <span style={{ gridArea: 'label' }}>{label}</span>
          {renderDescription()}
        </label>
        <input
          data-testid={dataTestId ?? 'file-input'}
          ref={inputRef}
          id={`${id}_file_input`}
          name={id}
          type="file"
          multiple={multi}
          onChange={onFilesChanged}
          style={{ display: 'none' }}
        />
        <Button
          id={id}
          data-testid="file-input-button"
          className={cx({ [buttonStyles]: true })}
          onClick={() => {
            if (inputRef.current) {
              inputRef.current.click();
            }
          }}
          title="Select a file"
          leftGlyph={<Icon glyph="AddFile" title={null} fill="currentColor" />}
        >
          {buttonText}
        </Button>
      </div>
      {error && errorMessage && (
        <Label
          data-testid={'file-input-error'}
          className={errorMessageStyles}
          htmlFor={''}
        >
          {errorMessage}
        </Label>
      )}
    </div>
  );
}

export default FileInput;
