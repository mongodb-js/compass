import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import decomment from 'decomment';
import { InfoSprinkle } from 'hadron-react-components';
import { Tooltip } from 'hadron-react-components';
import { OUT } from 'modules/pipeline';

import styles from './stage-preview-toolbar.less';

/**
 * Zero state text.
 */
const ZERO_STATE = 'A sample of the aggregated results from this stage will be shown below';

/**
 * Disabled text.
 */
const DISABLED = 'Stage is disabled. Results not passed in the pipeline.';

import {
  STAGE_SPRINKLE_MAPPINGS
} from '../../constants';

/**
 * The stage preview toolbar component.
 */
class StagePreviewToolbar extends PureComponent {
  static displayName = 'StagePreviewToolbar';
  static propTypes = {
    isEnabled: PropTypes.bool.isRequired,
    isValid: PropTypes.bool.isRequired,
    stageOperator: PropTypes.string,
    stageValue: PropTypes.any,
    count: PropTypes.number.isRequired,
    openLink: PropTypes.func.isRequired
  }

  /**
   * Get the word.
   *
   * @returns {String} The word.
   */
  getWord() {
    return this.props.count === 1 ? 'document' : 'documents';
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
          return `Documents will be saved to the collection: ${decomment(this.props.stageValue)}`;
        }
        const stageInfo = STAGE_SPRINKLE_MAPPINGS[this.props.stageOperator];
        return (
          <div>
            <span>
              Output after <span
                onClick={this.props.openLink.bind(this, stageInfo.link)}
                className={classnames(styles['stage-preview-toolbar-link'])}>
                {this.props.stageOperator}
              </span> stage
            </span>
            {this.renderInfoSprinkle(stageInfo)}
            <span>(Sample of {this.props.count} {this.getWord()})</span>
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
      return (
        <span
          data-tip={stageInfo.tooltip}
          data-for="stage-tooltip"
          data-place="top"
          data-html="true">
          <InfoSprinkle
            onClickHandler={this.props.openLink}
            helpLink={stageInfo.link}
          />
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
      <div className={classnames(styles['stage-preview-toolbar'])}>
        {this.getText()}
      </div>
    );
  }
}

export default StagePreviewToolbar;
