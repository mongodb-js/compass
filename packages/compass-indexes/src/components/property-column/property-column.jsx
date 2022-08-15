import map from 'lodash.map';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import getIndexHelpLink from '../../utils/index-link-helper';

import {
  spacing,
  css,
  Tooltip,
  Body,
  Badge,
  BadgeVariant,
  Icon,
  Link,
  uiColors,
} from '@mongodb-js/compass-components';

const contentStyles = css({
  display: 'flex',
  gap: spacing[1],
});

const badgeStyles = css({
  gap: spacing[2],
});

const iconLinkStyles = css({
  lineHeight: 0,
  color: uiColors.white,
  span: {
    // LG uses backgroundImage instead of textDecoration
    backgroundImage: 'none !important',
  },
});

class PropertyColumn extends PureComponent {
  static displayName = 'PropertyColumn';

  static propTypes = {
    index: PropTypes.object.isRequired,
    openLink: PropTypes.func.isRequired,
  };

  _partialTooltip() {
    const { partialFilterExpression } = this.props.index.extra;
    return `partialFilterExpression: ${JSON.stringify(
      partialFilterExpression
    )}`;
  }

  _ttlTooltip() {
    const { expireAfterSeconds } = this.props.index.extra;
    return `expireAfterSeconds: ${expireAfterSeconds}`;
  }

  renderItemWithTooltip(text, link, tooltip) {
    return (
      <Tooltip
        enabled={!!tooltip}
        trigger={({ children, ...props }) => (
          <span {...props}>
            {children}
            <Badge variant={BadgeVariant.DarkGray} className={badgeStyles}>
              {text}
              <Link
                hideExternalIcon
                aria-label="Index property docs"
                className={iconLinkStyles}
                href={link}
              >
                <Icon glyph="InfoWithCircle" />
              </Link>
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
      <td>
        <div className={contentStyles}>
          {properties}
          {this.renderCardinality()}
        </div>
      </td>
    );
  }
}

export default PropertyColumn;
