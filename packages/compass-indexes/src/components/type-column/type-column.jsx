import map from 'lodash.map';
import pick from 'lodash.pick';
import { format } from 'util';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { InfoSprinkle } from 'hadron-react-components';
import ReactTooltip from 'react-tooltip';
import getIndexHelpLink from '../../utils/index-link-helper';

const TOOLTIP_ID = 'index-type';

import classnames from 'classnames';
import styles from './type-column.module.less';

/**
 * Component for the type column.
 */
class TypeColumn extends PureComponent {
  static displayName = 'TypeColumn';

  static propTypes = {
    index: PropTypes.object.isRequired,
    openLink: PropTypes.func.isRequired
  };

  _textTooltip() {
    const info = pick(this.props.index.extra, ['weights', 'default_language', 'language_override', 'wildcardProjection']);
    return map(info, (v, k) => {
      return format('%s: %j', k, v);
    }).join('<br />');
  }

  /**
   * Render the type div.
   *
   * @returns {React.Component} The type div.
   */
  renderType() {
    let tooltipOptions = {};
    if (this.props.index.type === 'text' || this.props.index.type === 'wildcard') {
      const tooltipText = `${this._textTooltip()}`;
      tooltipOptions = {
        'data-tip': tooltipText,
        'data-for': TOOLTIP_ID,
        'data-effect': 'solid',
        'data-multiline': true,
        'data-border': true
      };
    }
    return (
      <div {...tooltipOptions} className={classnames(styles[`type-column-property-${this.props.index.type}`])} data-test-id="index-table-type">
        {this.props.index.type}
        <InfoSprinkle
          helpLink={getIndexHelpLink(this.props.index.type.toUpperCase())}
          onClickHandler={this.props.openLink}
        />
      </div>
    );
  }

  /**
   * Render the type column.
   *
   * @returns {React.Component} The type column.
   */
  render() {
    return (
      <td className={classnames(styles['type-column'])}>
        {this.renderType()}
        <ReactTooltip id={TOOLTIP_ID} />
      </td>
    );
  }
}

export default TypeColumn;
