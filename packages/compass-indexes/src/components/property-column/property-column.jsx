import map from 'lodash.map';
import { format } from 'util';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ReactTooltip from 'react-tooltip';
import { InfoSprinkle } from 'hadron-react-components';
import { shell } from 'electron';
import getIndexHelpLink from '../../utils/index-link-helper';

import classnames from 'classnames';
import styles from './property-column.module.less';

const TOOLTIP_ID = 'index-property';

/**
 * Component for the property column.
 */
class PropertyColumn extends PureComponent {
  static displayName = 'PropertyColumn';

  static propTypes = {
    index: PropTypes.object.isRequired,
    openLink: PropTypes.func.isRequired,
  };

  _partialTooltip() {
    return format(
      'partialFilterExpression: %j',
      this.props.index.extra.partialFilterExpression
    );
  }

  _ttlTooltip() {
    return format(
      'expireAfterSeconds: %d',
      this.props.index.extra.expireAfterSeconds
    );
  }

  /**
   * Render cardinality info.
   *
   * @returns {React.Component} The cardianlity info.
   */
  renderCardinality() {
    if (this.props.index.cardinality === 'compound') {
      return (
        <div
          className={classnames(styles['property-column-property-cardinality'])}
        >
          {this.props.index.cardinality}
          <InfoSprinkle
            helpLink={getIndexHelpLink('COMPOUND')}
            onClickHandler={this.props.openLink}
          />
        </div>
      );
    }
  }

  /**
   * Render the property column
   *
   * @param {String} prop - The property.
   *
   * @returns {React.Component} The property component.
   */
  renderProperty(prop) {
    const tooltipOptions = {
      'data-for': TOOLTIP_ID,
      'data-effect': 'solid',
      'data-border': true,
    };

    if (prop === 'ttl') {
      tooltipOptions['data-tip'] = this._ttlTooltip();
      return (
        <div
          {...tooltipOptions}
          key={prop}
          className={classnames(styles['property-column-property'])}
        >
          {prop}
          <InfoSprinkle
            helpLink={getIndexHelpLink('TTL')}
            onClickHandler={shell.openExternal}
          />
        </div>
      );
    } else if (prop === 'partial') {
      tooltipOptions['data-tip'] = this._partialTooltip();
      return (
        <div
          {...tooltipOptions}
          key={prop}
          className={classnames(styles['property-column-property'])}
        >
          {prop}
          <InfoSprinkle
            helpLink={getIndexHelpLink('PARTIAL')}
            onClickHandler={shell.openExternal}
          />
        </div>
      );
    }
    return (
      <div
        key={prop}
        className={classnames(styles['property-column-property'])}
      >
        {prop}
        <InfoSprinkle
          helpLink={getIndexHelpLink(prop.toUpperCase())}
          onClickHandler={shell.openExternal}
        />
      </div>
    );
  }

  /**
   * Render the property column.
   *
   * @returns {React.Component} The property column.
   */
  render() {
    const properties = map(this.props.index.properties, (prop) => {
      return this.renderProperty(prop);
    });
    return (
      <td className={classnames(styles['property-column'])}>
        <div>
          {properties}
          <ReactTooltip id={TOOLTIP_ID} />
          {this.renderCardinality()}
        </div>
      </td>
    );
  }
}

export default PropertyColumn;
