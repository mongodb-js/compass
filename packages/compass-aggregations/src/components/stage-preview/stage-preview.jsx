import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Document } from '@mongodb-js/compass-crud';
import HadronDocument from 'hadron-document';
// import LoadingOverlay from 'components/loading-overlay';
import classnames from 'classnames';

import styles from './stage-preview.less';

/**
 * The stage preview component.
 */
class StagePreview extends PureComponent {
  static displayName = 'StagePreview';

  static propTypes = {
    documents: PropTypes.array.isRequired,
    isValid: PropTypes.bool.isRequired,
    isLoading: PropTypes.bool.isRequired
  }

  renderPreview() {
    if (this.props.isValid) {
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
        <i>Error: No Preview Document</i>
      </div>
    );
  }

  /**
   * Renders the stage preview.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const iconClassName = classnames({
      'fa': true,
      'fa-angle-double-right': true,
      [ styles['stage-preview-arrow'] ]: true
    });
    return (
      <div className={classnames(styles['stage-preview'])}>
        <i className={iconClassName} aria-hidden />
        {this.renderPreview()}
      </div>
    );
  }
}

export default StagePreview;
