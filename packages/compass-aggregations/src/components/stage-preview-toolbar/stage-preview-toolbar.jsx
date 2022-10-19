import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import decomment from 'decomment';
import { Tooltip } from 'hadron-react-components';
import { OUT } from '../../modules/pipeline';
import { InlineInfoLink, Link } from '@mongodb-js/compass-components';
import { STAGE_SPRINKLE_MAPPINGS } from '../../constants';
import { connect } from 'react-redux';

import styles from './stage-preview-toolbar.module.less';

/**
 * Zero state text.
 */
const ZERO_STATE = 'A sample of the aggregated results from this stage will be shown below';

/**
 * Disabled text.
 */
const DISABLED = 'Stage is disabled. Results not passed in the pipeline.';

const OUT_COLL = 'Documents will be saved to the collection:';
const OUT_S3 = 'Documents will be saved to S3.';
const OUT_ATLAS = 'Documents will be saved to Atlas cluster.';

const S3_MATCH = /s3:/;
const ATLAS_MATCH = /atlas:/;

/**
 * The stage preview toolbar component.
 */
export class StagePreviewToolbar extends PureComponent {
  static propTypes = {
    index: PropTypes.number.isRequired,
    stageOperator: PropTypes.string,
    stageValue: PropTypes.string,
    hasServerError: PropTypes.bool,
    isEnabled: PropTypes.bool,
    isValid: PropTypes.bool,
    previewSize: PropTypes.number.isRequired
  };

  /**
   * Get the word.
   *
   * @returns {String} The word.
   */
  getWord() {
    return this.props.previewSize === 1 ? 'document' : 'documents';
  }

  getOutText() {
    try {
      const value = decomment(this.props.stageValue);
      if (value.match(S3_MATCH)) return OUT_S3;
      if (value.match(ATLAS_MATCH)) return OUT_ATLAS;
      return `${OUT_COLL} ${value}`;
    } catch (err) {
      // The validity check may not have been run yet, in which
      // case certain inputs like """ may cause decommenting to error.
      // https://jira.mongodb.org/browse/COMPASS-4368
      return 'Unable to parse the destination for the out stage.';
    }
  }

  /**
   * Get the stage preview text.
   *
   * @returns {String} The text.
   */
  getText() {
    if (this.props.isEnabled) {
      if (this.props.stageOperator) {
        if (this.props.stageOperator === OUT && this.props.isValid) {
          return this.getOutText();
        }

        const stageInfo = STAGE_SPRINKLE_MAPPINGS[this.props.stageOperator];

        let stageInfoButton = null

        if (stageInfo) {
          stageInfoButton = (
            <Link
              target="_blank"
              className={styles['stage-preview-toolbar-link']}
              href={stageInfo.link}
            >
              {this.props.stageOperator}
            </Link>
          );
        } else {
          stageInfoButton = (
            <span className={styles['stage-preview-toolbar-link-invalid']}>
              {this.props.stageOperator}
            </span>
          );
        }

        return (
          <div>
            <span>
              Output after {stageInfoButton} stage
            </span>
            {this.renderInfoSprinkle(stageInfo)}
            <span data-testid="stage-preview-toolbar-tooltip">(Sample of {this.props.previewSize} {this.getWord()})</span>
          </div>
        );
      }
      return ZERO_STATE;
    }
    return DISABLED;
  }

  /**
   * Render the info sprinkle.
   *
   * @returns {Component} The component.
   */
  renderInfoSprinkle(stageInfo) {
    if (this.props.stageOperator) {
      if (!stageInfo) {
        return (
          <span>{' '}</span>
        );
      }
      return (
        <span
          data-tip={stageInfo.tooltip}
          data-for="stage-tooltip"
          data-place="top"
          data-html="true"
        >
          <InlineInfoLink aria-label='Learn more' href={stageInfo.link} />
          <Tooltip id="stage-tooltip" />
        </span>
      );
    }
  }

  /**
   * Renders the stage preview toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['stage-preview-toolbar'], {
        [styles['stage-preview-toolbar-errored']]: this.props.hasServerError
      })}>
        {this.getText()}
      </div>
    );
  }
}

export default connect((state, ownProps) => {
  const stage = state.pipelineBuilder.stageEditor.stages[ownProps.index];
  return {
    stageOperator: stage.stageOperator,
    stageValue: stage.value,
    hasServerError: !!stage.serverError,
    isEnabled: !stage.disabled,
    isValid: !stage.serverError && !stage.syntaxError,
    previewSize: stage.previewDocs?.length ?? 0
  };
}, null)(StagePreviewToolbar);
