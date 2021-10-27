/** @jsx jsx */
import React from 'react';
import path from 'path';
import { css, jsx } from '@emotion/react';

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
  padding-right: 15px;
  margin: auto;
`;

const labelErrorStyles = css`
  color: red;
`;

const labelIconStyles = css`
  display: inline-block;
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

function FileInput({
  id,
  label,
  changeHandler,
  multi = false,
  error = false,
  variant = Variant.Horizontal,
  link,
  values,
}: {
  id: string;
  label: string;
  changeHandler: (files: string[]) => void;
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
        console.log(file, Object.keys(file));
        return file.path;
      });
      changeHandler(files);
    },
    [changeHandler]
  );

  const formItemCSS = [];
  const labelCSS = [];
  const buttonCSS = [buttonStyles];

  if (variant === Variant.Horizontal) {
    formItemCSS.push(formItemHorizontalStyles);
    labelCSS.push(labelHorizontalStyles);
  } else {
    formItemCSS.push(formItemVerticalStyles);
  }

  if (error) {
    formItemCSS.push(formItemErrorStyles);
    labelCSS.push(labelErrorStyles);
    buttonCSS.push(buttonErrorStyles);
  }

  return (
    <div css={formItemCSS}>
      <label htmlFor={id} css={labelCSS}>
        <span>{label}</span>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            css={labelIconStyles}
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
        css={buttonCSS}
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
