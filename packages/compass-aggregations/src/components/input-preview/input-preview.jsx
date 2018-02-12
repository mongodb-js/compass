import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Document } from '@mongodb-js/compass-crud';
import HadronDocument from 'hadron-document';

import styles from './input-preview.less';

/**
 * The input preview component.
 */
class InputPreview extends PureComponent {
  static displayName = 'InputPreview';

  static propTypes = {
    inputDocuments: PropTypes.object.isRequired
  }

  /**
   * Renders the input preview.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const iconClassName = classnames({
      'fa': true,
      'fa-angle-double-right': true,
      [ styles['input-preview-arrow'] ]: true
    });
    const documents = this.props.inputDocuments.documents.map((doc, i) => {
      return (
        <Document
          doc={new HadronDocument(doc)}
          editable={false}
          key={i} />);
    });
    return (
      <div className={classnames(styles['input-preview'])}>
        <i className={iconClassName} aria-hidden />
        <div className={classnames(styles['input-preview-documents'])}>
          {documents}
        </div>
      </div>
    );
  }
}

export default InputPreview;
