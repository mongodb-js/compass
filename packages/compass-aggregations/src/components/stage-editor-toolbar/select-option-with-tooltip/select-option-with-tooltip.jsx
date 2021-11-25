import { AtlasLogoMark } from '@mongodb-js/compass-components';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'hadron-react-components';
import { Option } from 'react-select-plus';
import { isAtlasOnly } from '../../../utils/stage';

import styles from './select-option-with-tooltip.module.less';

class SelectOptionWithTooltip extends Component {
  static propTypes = {
    option: PropTypes.object.isRequired,
    className: PropTypes.string,
    children: PropTypes.node,
  };

  render() {
    const { option } = this.props;

    return (
      <div
        data-tip={option.description}
        data-place="right"
        data-for={`select-option-${option.name}`}
      >
        <Option {...this.props} className={styles.option + ' ' + this.props.className}>
          {this.props.children}

          {isAtlasOnly(option.env) &&
            <AtlasLogoMark size={12} className={styles.optionIcon} />}
        </Option>
        <Tooltip
          className={styles.tooltip}
          id={`select-option-${option.name}`}
        />
      </div>
    );
  }
}

export default SelectOptionWithTooltip;
