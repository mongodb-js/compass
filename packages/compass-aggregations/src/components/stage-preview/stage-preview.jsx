import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Document } from '@mongodb-js/compass-crud';
import HadronDocument from 'hadron-document';
import LoadingOverlay from 'components/loading-overlay';
import classnames from 'classnames';

import styles from './stage-preview.less';

/**
 * The stage preview component.
 */
class StagePreview extends Component {
  static displayName = 'StagePreview';

  static propTypes = {
    documents: PropTypes.array.isRequired,
    isValid: PropTypes.bool.isRequired,
    isLoading: PropTypes.bool.isRequired
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.isLoading !== this.props.isLoading;
  }

  renderPreview() {
    if (this.props.isValid && this.props.documents.length > 0) {
      const documents = this.props.documents.map((doc, i) => {
        return (<Document doc={new HadronDocument(doc)} editable={false} key={i} />);
      });
      return (
        <div className={classnames(styles['stage-preview-documents'])}>
          {documents}
        </div>
      );
    }
    return (
      <div className={classnames(styles['stage-preview-invalid'])}>
        <i>No Preview Documents</i>
      </div>
    );
  }

  /**
   * Renders the stage preview.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['stage-preview'])}>
        { this.props.isLoading ?
          <LoadingOverlay text="Loading Preview Documents..." /> :
          null
        }
        {this.renderPreview()}
      </div>
    );
  }
}

export default StagePreview;
