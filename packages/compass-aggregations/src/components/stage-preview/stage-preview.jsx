import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Document } from '@mongodb-js/compass-crud';
import { TextButton } from 'hadron-react-buttons';
import HadronDocument from 'hadron-document';
import LoadingOverlay from 'components/loading-overlay';
import { OUT } from 'modules/pipeline';
import classnames from 'classnames';

import styles from './stage-preview.less';

/**
 * The stage preview component.
 */
class StagePreview extends Component {
  static displayName = 'StagePreview';

  static propTypes = {
    runOutStage: PropTypes.func.isRequired,
    gotoOutResults: PropTypes.func.isRequired,
    documents: PropTypes.array.isRequired,
    isValid: PropTypes.bool.isRequired,
    isEnabled: PropTypes.bool.isRequired,
    isLoading: PropTypes.bool.isRequired,
    isComplete: PropTypes.any,
    index: PropTypes.number.isRequired,
    stageOperator: PropTypes.string,
    stageValue: PropTypes.any
  }

  /**
   * We don't want to diff the entire list of documents.
   *
   * @returns {Boolean} Whether the component should update.
   */
  shouldComponentUpdate() {
    return true;
  }

  /**
   * Goto the out results.
   */
  onGotoOutResults = () => {
    this.props.gotoOutResults(this.props.stageValue);
  }

  /**
   * On the save click, execute the $out.
   */
  onSaveDocuments = () => {
    this.props.runOutStage(this.props.index);
  }

  /**
   * If the stage operator is $out we have special behaviour.
   *
   * @returns {Component} The component.
   */
  renderOutSection() {
    if (this.props.isComplete) {
      return (
        <div className={classnames(styles['stage-preview-out'])}>
          <div className={classnames(styles['stage-preview-out-text'])}>
            Documents persisted to collection: {this.props.stageValue}.
          </div>
          <div
            className={classnames(styles['stage-preview-out-link'])}
            onClick={this.onGotoOutResults}>
            Go to collection.
          </div>
        </div>
      );
    }
    return (
      <div className={classnames(styles['stage-preview-out'])}>
        <div className={classnames(styles['stage-preview-out-text'])}>
          The $out operator will cause the pipeline to persist the results
          to the specified collection. If the collection exists it will be
          replaced. Please confirm to execute.
        </div>
        <div className={classnames(styles['stage-preview-out-button'])}>
          <TextButton
            text="Save Documents"
            className="btn btn-xs btn-primary"
            clickHandler={this.onSaveDocuments} />
        </div>
      </div>
    );
  }

  /**
   * Render the preview section.
   *
   * @returns {Component} The component.
   */
  renderPreview() {
    if (this.props.isValid && this.props.isEnabled) {
      if (this.props.stageOperator === OUT) {
        return this.renderOutSection();
      }
      if (this.props.documents.length > 0) {
        const documents = this.props.documents.map((doc, i) => {
          return (<Document doc={new HadronDocument(doc)} editable={false} key={i} />);
        });
        return (
          <div className={classnames(styles['stage-preview-documents'])}>
            {documents}
          </div>
        );
      }
    }
    return (
      <div className={classnames(styles['stage-preview-invalid'])}>
        <i>No Preview Documents</i>
      </div>
    );
  }

  /**
   * Render the loading overlay.
   *
   * @returns {Component} The component.
   */
  renderLoading() {
    if (this.props.isLoading) {
      if (this.props.stageOperator === OUT) {
        return (<LoadingOverlay text="Persisting Documents..." />);
      }
      return (<LoadingOverlay text="Loading Preview Documents..." />);
    }
  }

  /**
   * Renders the stage preview.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['stage-preview'])}>
        {this.renderLoading()}
        {this.renderPreview()}
      </div>
    );
  }
}

export default StagePreview;
