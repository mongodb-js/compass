import map from 'lodash.map';
import { format } from 'util';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { shell } from 'electron';
import getIndexHelpLink from '../../utils/index-link-helper';

import {
  spacing,
  css,
  Tooltip,
  Body,
  Badge,
  BadgeVariant,
  Icon,
} from '@mongodb-js/compass-components';

const containerStyles = css({
  width: 'auto',
  paddingLeft: spacing[4],
  paddingRight: spacing[4],
  marginTop: spacing[1],
  '*:not(:last-child)': {
    marginRight: spacing[1],
  },
});

const iconButtonStyles = css({
  padding: 0,
  background: 'transparent',
  border: 'none',
  lineHeight: 0,
  cursor: 'pointer',
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
            <Badge variant={BadgeVariant.DarkGray}>
              {text}&nbsp;
              <button aria-label='Index docs' className={iconButtonStyles} onClick={() => shell.openExternal(link)}>
                <Icon glyph='InfoWithCircle' />
              </button>
            </Badge>
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
        {properties}
        {this.renderCardinality()}
      </td>
    );
  }
}

export default PropertyColumn;
