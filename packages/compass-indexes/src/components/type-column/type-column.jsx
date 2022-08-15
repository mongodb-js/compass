import map from 'lodash.map';
import pick from 'lodash.pick';
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

const containerStyles = css({
  width: 'auto',
  paddingLeft: spacing[4],
  paddingRight: spacing[4],
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

/**
 * Component for the type column.
 */
class TypeColumn extends PureComponent {
  static displayName = 'TypeColumn';

  static propTypes = {
    index: PropTypes.object.isRequired,
    openLink: PropTypes.func.isRequired,
  };

  canRenderTooltip() {
    return (
      ['text', 'wildcard', 'columnstore'].indexOf(this.props.index.type) !== -1
    );
  }

  renderTooltip() {
    const info = pick(this.props.index.extra, [
      'weights',
      'default_language',
      'language_override',
      'wildcardProjection',
      'columnstoreProjection',
    ]);
    const items = map(info, (v, k) => {
      return <Body>{`${k}: ${JSON.stringify(v)}`}</Body>;
    });
    return <>{items}</>;
  }

  render() {
    const helpLink = getIndexHelpLink(this.props.index.type.toUpperCase());
    return (
      <td className={containerStyles} data-testid="index-field-type">
        <Tooltip
          enabled={this.canRenderTooltip()}
          trigger={({ children, ...props }) => (
            <span {...props}>
              {children}
              <Badge variant={BadgeVariant.DarkGray} className={badgeStyles}>
                {this.props.index.type}
                <Link
                  hideExternalIcon
                  aria-label="Index type docs"
                  className={iconLinkStyles}
                  href={helpLink}
                >
                  <Icon glyph="InfoWithCircle" />
                </Link>
              </Badge>
            </span>
          )}
        >
          {this.renderTooltip()}
        </Tooltip>
      </td>
    );
  }
}

export default TypeColumn;
