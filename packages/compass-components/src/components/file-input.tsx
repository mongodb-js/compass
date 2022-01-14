import React from 'react';
import path from 'path';
import { css, cx } from '@leafygreen-ui/emotion';
import { uiColors } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';

import { Button, Icon, IconButton, Label, Link, Description } from '..';

const { base: redBaseColor } = uiColors.red;

const formItemHorizontalStyles = css({
  marginTop: spacing[2],
  marginBottom: spacing[2],
  marginRight: 'auto',
  marginLeft: 'auto',
  display: 'flex',
  alignItems: 'center',
});

const formItemVerticalStyles = css({
  margin: '5px auto 20px',
});

const removeFileLineStyles = css({
  display: 'flex',
  flexDirection: 'row',
});

const removeFileButtonStyles = css({
  marginLeft: spacing[1],
});

const formItemErrorStyles = css({
  border: `1px solid ${redBaseColor}`,
  borderRadius: '5px',
  ['&:focus']: {
    border: `1px solid ${redBaseColor}`,
  },
});

const buttonStyles = css({
  width: '100%',
});

const disabledButtonStyles = css({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pointerEvents: 'auto !important' as any, // !important to override leafygreen styles misordering.
});

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

const labelIconStyles = css({
  display: 'inline-block',
  verticalAlign: 'middle',
  font: 'normal normal normal 14px/1 FontAwesome',
  fontSize: 'inherit',
  textRendering: 'auto',
  margin: '0 0 0 5px',
  cursor: 'pointer',
  color: '#bfbfbe',

  '&:link, &:active': {
    color: '#bfbfbe',
  },

  '&:link, &:active, &:hover': {
    textDecoration: 'none',
  },

  '&:hover': {
    color: '#fbb129',
  },
});

const disabledLabelStyles = css({
  '&:first-child': {
    pointerEvents: 'none',
  },
});

const disabledDescriptionStyles = css({
  color: uiColors.gray.dark1,
});

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
  disabled,
  multi = false,
  error = false,
  errorMessage,
  variant = Variant.Horizontal,
  showFileOnNewLine = false,
  link,
  description,
  values,
  labelAlignment = 'left',
}: {
  id: string;
  label: string;
  dataTestId?: string;
  onChange: (files: string[]) => void;
  disabled?: boolean;
  multi?: boolean;
  error?: boolean;
  errorMessage?: string;
  variant?: Variant;
  link?: string;
  description?: string;
  showFileOnNewLine?: boolean;
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
    [onChange, values]
  );

  const renderDescription = (): React.ReactElement | null => {
    if (!link && !description) {
      return null;
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
        <div
          className={cx(
            {
              [labelHorizontalStyles]: variant === Variant.Horizontal,
            },
            css({
              textAlign: labelAlignment,
            })
          )}
        >
          <label
            htmlFor={`${id}_file_input`}
            className={cx(
              {
                [disabledLabelStyles]: disabled,
                // [labelHorizontalStyles]: variant === Variant.Horizontal
              }
              // css({
              //   textAlign: labelAlignment,
              // })
            )}
          >
            <span
              className={cx({
                [disabledDescriptionStyles]: disabled,
              })}
              style={{ gridArea: 'label' }}
            >
              {label}
            </span>
          </label>
          {renderDescription()}
        </div>
        <input
          data-testid={dataTestId ?? 'file-input'}
          ref={inputRef}
          id={`${id}_file_input`}
          name={id}
          type="file"
          multiple={multi}
          onChange={onFilesChanged}
          style={{ display: 'none' }}
          // Force a re-render when the values change so
          // the component is controlled by the prop.
          key={values ? values.join(',') : 'empty'}
        />
        <Button
          id={id}
          data-testid="file-input-button"
          className={cx({
            [buttonStyles]: true,
            [disabledButtonStyles]: disabled,
          })}
          disabled={disabled}
          onClick={() => {
            if (!disabled && inputRef.current) {
              inputRef.current.click();
            }
          }}
          title="Select a file"
          leftGlyph={<Icon glyph="AddFile" title={null} fill="currentColor" />}
        >
          {buttonText}
        </Button>
      </div>
      {showFileOnNewLine &&
        values &&
        values.length > 0 &&
        values.map((value, index) => (
          <div className={removeFileLineStyles} key={value}>
            {value}
            <IconButton
              className={removeFileButtonStyles}
              aria-label="Remove file"
              onClick={() => {
                const newValues = [...values];
                newValues.splice(index, 1);
                onChange(newValues);
              }}
            >
              <Icon glyph="X" />
            </IconButton>
          </div>
        ))}
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
