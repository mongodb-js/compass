import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './add-stage-button.less';

/**
 * Default button classname.
 */
const CLASSNAME = 'btn btn-default btn-xs';

/**
 * Display the add stage button.
 */
class AddStageButton extends PureComponent {
  static displayName = 'AddStageButtonComponent';

  static propTypes = {
    className: PropTypes.string,
    stageAdded: PropTypes.func.isRequired
  }

  /**
   * Render the stage component.
   *
   * @returns {Component} The component.
   */
  render() {
    let className = CLASSNAME;
    if (this.props.className) {
      className = `${CLASSNAME} ${classnames(styles[this.props.className])}`;
    }
    return (
      <button className={className} onClick={this.props.stageAdded}>
        Add Stage
      </button>
    );
  }
}

export default AddStageButton;
