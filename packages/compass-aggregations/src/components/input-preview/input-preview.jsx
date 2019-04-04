import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Document } from '@mongodb-js/compass-crud';
import HadronDocument from 'hadron-document';
import LoadingOverlay from 'components/loading-overlay';

import styles from './input-preview.less';

/**
 * The input preview component.
 */
class InputPreview extends Component {
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
    console.log('InputPreview#render()', this.props);
    const documents = this.props.documents.map((doc, i) => {
      return (
        <Document
          doc={new HadronDocument(doc)}
          editable={false}
          tz="UTC"
          key={i} />);
    });
    return (
      <div className={classnames(styles['input-preview'])}>
        { this.props.isLoading ?
          <LoadingOverlay text="Sampling Documents..." /> :
          null
        }
        <div className={classnames(styles['input-preview-documents'])}>
          {documents}
        </div>
      </div>
    );
  }
}

export default InputPreview;
