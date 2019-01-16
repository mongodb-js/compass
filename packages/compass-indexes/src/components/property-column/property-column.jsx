import map from 'lodash.map';
import { format } from 'util';
import React from 'react';
import PropTypes from 'prop-types';
import ReactTooltip from 'react-tooltip';
import { InfoSprinkle } from 'hadron-react-components';
import { shell } from 'electron';
const getIndexHelpLink = require('../../index-link-helper'); // TODO

const TOOLTIP_ID = 'index-property';

/**
 * Component for the property column.
 */
class PropertyColumn extends React.Component {

  _partialTooltip() {
    return format('partialFilterExpression: %j', this.props.index.extra.partialFilterExpression);
  }

  _ttlTooltip() {
    return format('expireAfterSeconds: %d', this.props.index.extra.expireAfterSeconds);
  }

  /**
   * Render cardinality info.
   *
   * @returns {React.Component} The cardianlity info.
   */
  renderCardinality() {
    if (this.props.index.cardinality === 'compound') {
      return (
        <div className="property cardinality">
          {this.props.index.cardinality}
          <InfoSprinkle
            helpLink={getIndexHelpLink('COMPOUND')}
            onClickHandler={shell.openExternal}
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
      'data-border': true
    };

    if (prop === 'ttl') {
      tooltipOptions['data-tip'] = this._ttlTooltip();
      return (
        <div {...tooltipOptions} key={prop} className="property">
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
        <div {...tooltipOptions} key={prop} className="property">
          {prop}
          <InfoSprinkle
            helpLink={getIndexHelpLink('PARTIAL')}
            onClickHandler={shell.openExternal}
          />
        </div>
      );
    }
    return (
      <div key={prop} className="property">
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
      <td className="property-column">
        <div className="properties">
          {properties}
          <ReactTooltip id={TOOLTIP_ID} />
          {this.renderCardinality()}
        </div>
      </td>
    );
  }

}

PropertyColumn.displayProperty = 'PropertyColumn';

PropertyColumn.propTypes = {
  index: PropTypes.object.isRequired
};

export default PropertyColumn;
