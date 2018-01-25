import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Switch from 'react-ios-switch';

import styles from './sample.less';

/**
 * Empty string.
 */
const EMPTY = '';

/**
 * The sample component.
 */
class Sample extends PureComponent {
  static displayName = 'SampleComponent';

  static propTypes = {
    isEnabled: PropTypes.bool.isRequired,
    value: PropTypes.number.isRequired,
    sampleChanged: PropTypes.func.isRequired,
    sampleToggled: PropTypes.func.isRequired
  }

  /**
   * Handle sample changed events.
   */
  onSampleChanged = (evt) => {
    const value = evt.target.value;
    this.props.sampleChanged(value.trim() === EMPTY ? null : parseInt(value, 10));
  }

  /**
   * Render the sample component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles.sample)}>
        <div className={classnames(styles['sample-label'])}>
          Sample
        </div>
        <Switch
          checked={this.props.isEnabled}
          onChange={this.props.sampleToggled}
          className={classnames(styles['sample-toggle'])} />
        <input
          name="sample-value"
          type="text"
          className={classnames(styles['sample-value'])}
          onChange={this.onSampleChanged}
          value={this.props.value} />
      </div>
    );
  }
}

export default Sample;
