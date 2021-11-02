/** @jsx jsx */
import React from 'react';
import path from 'path';
import { css, cx } from '@emotion/css';
import { jsx } from '@emotion/react';

import { Button, Icon } from '..';

const formItemHorizontalStyles = css`
  margin: 15px auto 15px;
  display: flex;
  justify-content: flex-end;
`;

const formItemVerticalStyles = css`
  margin: 5px auto 20px;
`;

const formItemErrorStyles = css`
  border: 1px solid red;

  &:focus {
    border: 1px solid red;
  }
`;

const buttonStyles = css`
  width: 100%;
`;

const buttonErrorStyles = css`
  border: 1px solid red;
`;

const labelHorizontalStyles = css`
  width: 70%;
  text-align: right;
  vertical-align: middle;
  padding-right: 15px;
  margin: auto;
  margin-bottom: 0;
`;

const labelErrorStyles = css`
  color: red;
`;

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
  onChange,
  multi = false,
  error = false,
  variant = Variant.Horizontal,
  link,
  values,
}: {
  id: string;
  label: string;
  onChange: (files: string[]) => void;
  multi?: boolean;
  error?: boolean;
  variant?: Variant;
  link?: string;
  values?: string[];
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

  return (
    <div
      className={cx(
        { [formItemHorizontalStyles]: variant === Variant.Horizontal },
        { [formItemVerticalStyles]: variant === Variant.Vertical },
        { [formItemErrorStyles]: error }
      )}
    >
      <label
        htmlFor={id}
        className={cx(
          { [labelHorizontalStyles]: variant === Variant.Horizontal },
          { [labelErrorStyles]: error }
        )}
      >
        <span>{label}</span>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className={labelIconStyles}
            data-testid="file-input-link"
          >
            
          </a>
        )}
      </label>
      <input
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
        className={cx({ [buttonStyles]: true }, { [buttonErrorStyles]: error })}
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
  );
}

export default FileInput;
