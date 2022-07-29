import map from 'lodash.map';
import { format } from 'util';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { shell } from 'electron';
import getIndexHelpLink from '../../utils/index-link-helper';

import {
  spacing,
  css,
  IconBadge,
  Tooltip,
  Body,
} from '@mongodb-js/compass-components';

const containerStyles = css({
  width: 'auto',
  paddingLeft: spacing[4],
  paddingRight: spacing[4],
});

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

  renderItemWithTooltip(text, link, tooltip) {
    return (
      <Tooltip
        enabled={!!tooltip}
        trigger={({ children, ...props }) => (
          <span {...props}>
            {children}
            <IconBadge
              text={text}
              icon={'InfoWithCircle'}
              onClick={() => shell.openExternal(link)}
            />
          </span>
        )}
      >
        <Body>{tooltip}</Body>
      </Tooltip>
    );
  }

  renderCardinality() {
    const { cardinality } = this.props.index;
    if (cardinality !== 'compound') {
      return null;
    }
    return this.renderItemWithTooltip(
      cardinality,
      getIndexHelpLink('COMPOUND')
    );
  }

  renderProperty(prop) {
    const tooltip =
      prop === 'ttl'
        ? this._ttlTooltip()
        : prop === 'partial'
        ? this._partialTooltip()
        : null;

    return this.renderItemWithTooltip(
      prop,
      getIndexHelpLink(prop.toUpperCase()),
      tooltip
    );
  }

  render() {
    const properties = map(
      this.props.index.properties,
      this.renderProperty.bind(this)
    );
    return (
      <td className={containerStyles}>
        <div>
          {properties}
          {this.renderCardinality()}
        </div>
      </td>
    );
  }
}

export default PropertyColumn;
