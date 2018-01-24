import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Sample from 'components/sample';

import styles from './pipeline-footer.less';

/**
 * Displays the pipeline footer.
 */
class PipelineFooter extends PureComponent {
  static displayName = 'PipelineFooterComponent';

  static propTypes = {
    sample: PropTypes.object.isRequired,
    sampleChanged: PropTypes.func.isRequired,
    sampleToggled: PropTypes.func.isRequired
  }

  /**
   * Render the pipeline footer component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['pipeline-footer'])}>
        <Sample
          isEnabled={this.props.sample.isEnabled}
          value={this.props.sample.value}
          sampleToggled={this.props.sampleToggled}
          sampleChanged={this.props.sampleChanged} />
      </div>
    );
  }
}

export default PipelineFooter;
