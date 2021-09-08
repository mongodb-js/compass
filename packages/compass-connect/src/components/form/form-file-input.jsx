import React from 'react';
import Button from '@leafygreen-ui/button';
import PropTypes from 'prop-types';
import path from 'path';
import { shell } from 'electron';
import classnames from 'classnames';
import Icon from '@leafygreen-ui/icon';

import styles from '../connect.module.less';

function FormFileInput({
  id,
  label,
  multi,
  error,
  link,
  values,
  changeHandler
}) {
  const inputRef = React.useRef(null);

  const className = React.useMemo(() => {
    return classnames({
      [styles['form-item']]: true,
      [styles['form-item-has-error']]: Boolean(error)
    });
  }, [error]);

  const buttonText = React.useMemo(() => {
    if (Array.isArray(values) && values.length > 0) {
      return values.map((file) => path.basename(file)).join(', ');
    }

    return multi ? 'Select files...' : 'Select a file...';
  }, [values, multi]);

  const onFilesChanged = React.useCallback(
    (evt) => {
      const files = Array.from(evt.currentTarget.files).map(
        (file) => file.path
      );
      changeHandler(files);
    },
    [changeHandler]
  );

  return (
    <div className={className}>
      <label htmlFor={id}>
        <span>{label}</span>
        {link && (
          <i
            className={classnames(styles.help)}
            onClick={() => shell.openExternal(link)}
          />
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
        className={styles['form-item-file-button']}
        onClick={() => {
          inputRef.current.click();
        }}
        title="Select a file"
        leftGlyph={<Icon glyph="AddFile" title={false} fill="currentColor" />}
      >
        {buttonText}
      </Button>
    </div>
  );
}

FormFileInput.propTypes = {
  label: PropTypes.string.isRequired,
  changeHandler: PropTypes.func.isRequired,
  id: PropTypes.string,
  values: PropTypes.array,
  multi: PropTypes.bool,
  link: PropTypes.string,
  error: PropTypes.bool
};

export default FormFileInput;
