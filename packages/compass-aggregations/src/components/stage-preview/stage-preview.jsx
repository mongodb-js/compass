import { AtlasLogoMark } from '@mongodb-js/compass-components';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Document } from '@mongodb-js/compass-crud';
import { TextButton } from 'hadron-react-buttons';
import HadronDocument from 'hadron-document';
import LoadingOverlay from '../loading-overlay';
import { OUT, MERGE } from '../../modules/pipeline';
import decomment from 'decomment';

import styles from './stage-preview.module.less';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
const { track } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

/**
 * The stage preview component.
 */
class StagePreview extends Component {
  static displayName = 'StagePreview';

  static propTypes = {
    runOutStage: PropTypes.func.isRequired,
    gotoOutResults: PropTypes.func.isRequired,
    gotoMergeResults: PropTypes.func.isRequired,
    documents: PropTypes.array.isRequired,
    error: PropTypes.string,
    isValid: PropTypes.bool.isRequired,
    isEnabled: PropTypes.bool.isRequired,
    isLoading: PropTypes.bool.isRequired,
    isComplete: PropTypes.bool.isRequired,
    // Can be undefined on the initial render
    isMissingAtlasOnlyStageSupport: PropTypes.bool,
    openLink: PropTypes.func.isRequired,
    index: PropTypes.number.isRequired,
    stageOperator: PropTypes.string,
    stage: PropTypes.string
  }

  /**
   * Goto the merge results.
   */
  onGotoMergeResults = () => {
    this.props.gotoMergeResults(this.props.index);
  }

  /**
   * Goto the out results.
   */
  onGotoOutResults = () => {
    const collection = decomment(this.props.stage).replace(/['"]+/g, '');
    this.props.gotoOutResults(collection);
  }

  /**
   * On the save click, execute the $out or $merge.
   */
  onSaveDocuments = () => {
    this.props.runOutStage(this.props.index);
  }

  /**
   * Called when the Atlas Signup CTA link is clicked.
   */
  onAtlasSignupCtaClicked = () => {
    track('Atlas Link Clicked', { screen: 'agg_builder' });
    this.props.openLink('https://www.mongodb.com/cloud/atlas/lp/search-1?utm_campaign=atlas_search&utm_source=compass&utm_medium=product&utm_content=v1');
  }

  /**
   * If the stage operator is $merge we have special behaviour.
   *
   * @returns {Component} The component.
   */
  renderMergeSection() {
    if (this.props.isComplete) {
      if (!this.props.error) {
        return (
          <div className={styles['stage-preview-out']}>
            <div className={styles['stage-preview-out-text']}>
              Documents persisted to collection specified by $merge.
            </div>
            <div
              className={styles['stage-preview-out-link']}
              onClick={this.onGotoMergeResults}>
              Go to collection.
            </div>
          </div>
        );
      }
      return (<div className={styles['stage-preview-out']} />);
    }
    return (
      <div className={styles['stage-preview-out']}>
        <div className={styles['stage-preview-out-text']}>
          The $merge operator will cause the pipeline to persist the results
          to the specified location. Please confirm to execute.
        </div>
        <div className={styles['stage-preview-out-button']}>
          <TextButton
            text="Merge Documents"
            className="btn btn-xs btn-primary"
            clickHandler={this.onSaveDocuments} />
        </div>
      </div>
    );
  }

  /**
   * If the stage operator is $out we have special behaviour.
   *
   * @returns {Component} The component.
   */
  renderOutSection() {
    if (this.props.isComplete) {
      if (!this.props.error) {
        return (
          <div className={styles['stage-preview-out']}>
            <div className={styles['stage-preview-out-text']}>
              Documents persisted to collection: {decomment(this.props.stage)}.
            </div>
            <div
              className={styles['stage-preview-out-link']}
              onClick={this.onGotoOutResults}>
              Go to collection.
            </div>
          </div>
        );
      }
      return (<div className={styles['stage-preview-out']} />);
    }
    return (
      <div className={styles['stage-preview-out']}>
        <div className={styles['stage-preview-out-text']}>
          The $out operator will cause the pipeline to persist the results
          to the specified location (collection, S3, or Atlas). If the collection exists it will be
          replaced. Please confirm to execute.
        </div>
        <div className={styles['stage-preview-out-button']}>
          <TextButton
            text="Save Documents"
            className="btn btn-xs btn-primary"
            clickHandler={this.onSaveDocuments}
          />
        </div>
      </div>
    );
  }

  /**
   * If the stage operator is a full-text search operator and it is not supported we
   * show a Atlas signup CTA.
   *
   * @returns {Component} The component.
   */
  renderAtlasOnlyStagePreviewSection() {
    return (
      <div className={styles['stage-preview-missing-search-support']}>
        <AtlasLogoMark size={30} className={styles['stage-preview-missing-search-support-icon']} />
        <div data-test-id="stage-preview-missing-search-support" className={styles['stage-preview-missing-search-support-text']}>
          This stage is only available with MongoDB Atlas.

          Create a free cluster or connect to an Atlas cluster to build search indexes and use {this.props.stageOperator} aggregation stage to run fast, relevant search queries.
        </div>
        <TextButton
          text="Create Free Cluster"
          className="btn btn-xs btn-primary"
          clickHandler={this.onAtlasSignupCtaClicked}
        />
      </div>
    );
  }

  /**
   * Render the preview section.
   *
   * @returns {Component} The component.
   */
  renderPreview() {
    if (this.props.isMissingAtlasOnlyStageSupport) {
      return this.renderAtlasOnlyStagePreviewSection();
    }
    if (this.props.isValid && this.props.isEnabled) {
      if (this.props.stageOperator === OUT) {
        return this.renderOutSection();
      }
      if (this.props.stageOperator === MERGE) {
        return this.renderMergeSection();
      }
      if (this.props.documents.length > 0) {
        const documents = this.props.documents.map((doc, i) => {
          return (<Document doc={new HadronDocument(doc)} editable={false} key={i} tz="UTC" />);
        });
        return (
          <div className={styles['stage-preview-documents']}>
            {documents}
          </div>
        );
      }
    }
    if (this.props.isLoading) {
      // Don't render the empty state when loading.
      return;
    }
    return (
      <div className={styles['stage-preview-empty']}>
        <div>
          <svg width="44" height="60" viewBox="0 0 44 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.9297 38.2988C23.4783 35.1247 27.7679 30.0989 32.5375 35.3879"/>
            <path d="M1 10.7831V51.3133L9.61538 59M1 10.7831L35.4615 1L43 5.19277M1 10.7831L10.1538 15.6747M9.61538 59L43 45.7229C39.9487 34.0763 38 22.5957 43 5.19277M9.61538 59C5.5 34.9362 7.46154 20.3333 10.1538 15.6747M43 5.19277L10.1538 15.6747"/>
            <path d="M19.7174 26.7113C19.7734 27.324 19.6719 27.8684 19.4884 28.2491C19.2999 28.6402 19.0726 28.7786 18.9038 28.7941C18.7349 28.8095 18.4862 28.7146 18.2299 28.3642C17.9804 28.0232 17.7818 27.5063 17.7257 26.8935C17.6696 26.2808 17.7711 25.7364 17.9546 25.3557C18.1432 24.9646 18.3704 24.8262 18.5393 24.8107C18.7082 24.7953 18.9568 24.8902 19.2132 25.2406C19.4627 25.5816 19.6613 26.0985 19.7174 26.7113Z" fill="#89979B"/>
            <path d="M32.481 23.5351C32.5371 24.1479 32.4356 24.6923 32.2521 25.0729C32.0636 25.464 31.8363 25.6025 31.6674 25.6179C31.4985 25.6334 31.2499 25.5385 30.9935 25.1881C30.744 24.847 30.5454 24.3301 30.4894 23.7174C30.4333 23.1046 30.5348 22.5602 30.7183 22.1796C30.9068 21.7885 31.1341 21.65 31.303 21.6346C31.4719 21.6191 31.7205 21.714 31.9769 22.0644C32.2264 22.4055 32.425 22.9224 32.481 23.5351Z" fill="#89979B"/>
          </svg>
        </div>
        <div>
          <i data-test-id="stage-preview-empty">No Preview Documents</i>
        </div>
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
      <div className={styles['stage-preview']}>
        {this.renderLoading()}
        {this.renderPreview()}
      </div>
    );
  }
}

export default StagePreview;
