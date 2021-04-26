import React from 'react';
import classnames from 'classnames';

import styles from './input-preview-toolbar.less';

/**
 * The static text.
 */
const TEXT = 'Preview of Documents in the Collection';

/**
 * The input preview toolbar component.
 *
 * @returns {React.Component} The component.
 */
const InputPreviewToolbar = () => {
  return (
    <div className={classnames(styles['input-preview-toolbar'])}>
      <div className={classnames(styles['input-preview-toolbar-text'])}>
        {TEXT}
      </div>
    </div>
  );
};

InputPreviewToolbar.displayName = 'InputPreviewToolbar';

export default InputPreviewToolbar;
