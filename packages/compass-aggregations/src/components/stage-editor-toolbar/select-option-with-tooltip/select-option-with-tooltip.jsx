import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'hadron-react-components';
import { Option } from 'react-select-plus';

import styles from './select-option-with-tooltip.less';

class SelectOptionWithTooltip extends Component {
  static propTypes = {
    option: PropTypes.object
  };

  render() {
    const { option } = this.props;

    return (
      <div
        data-tip={option.description}
        data-place="right"
        data-for={`select-option-${option.name}`}
      >
        <Option {...this.props} />
        <Tooltip
          className={styles.tooltip}
          id={`select-option-${option.name}`}
        />
      </div>
    );
  }
}

export default SelectOptionWithTooltip;
