import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Document } from '@mongodb-js/compass-crud';
import HadronDocument from 'hadron-document';
import LoadingOverlay from 'components/loading-overlay';

import styles from './input-preview.less';

/**
 * The input preview component.
 */
class InputPreview extends PureComponent {
  static displayName = 'InputPreview';

  static propTypes = {
    documents: PropTypes.array.isRequired,
    isLoading: PropTypes.bool.isRequired
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
    const documents = this.props.documents.map((doc, i) => {
      return (
        <Document
          doc={new HadronDocument(doc)}
          editable={false}
          key={i} />);
    });
    return (
      <div className={classnames(styles['input-preview'])}>
        { this.props.isLoading ?
          <LoadingOverlay text="Sampling Documents..." /> :
          null
        }
        <i className={iconClassName} aria-hidden />
        <div className={classnames(styles['input-preview-documents'])}>
          {documents}
        </div>
      </div>
    );
  }
}

export default InputPreview;
