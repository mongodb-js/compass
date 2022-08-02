import map from 'lodash.map';
import pick from 'lodash.pick';
import { format } from 'util';
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
} from '@mongodb-js/compass-components';

const containerStyles = css({
  width: 'auto',
  paddingLeft: spacing[4],
  paddingRight: spacing[4],
});

const iconButtonStyles = css({
  padding: 0,
  background: 'transparent',
  border: 'none',
  lineHeight: 0,
  cursor: 'pointer',
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
      return <Body>{format('%s: %j', k, v)}</Body>;
    });
    return <>{items}</>;
  }

  render() {
    const helpLink = getIndexHelpLink(this.props.index.type.toUpperCase());
    return (
      <td className={containerStyles} data-testid="index-table-type">
        <Tooltip
          enabled={this.canRenderTooltip()}
          trigger={({ children, ...props }) => (
            <span {...props}>
              {children}
              <Badge variant={BadgeVariant.DarkGray}>
                {this.props.index.type}&nbsp;
                <button aria-label='Index docs' className={iconButtonStyles} onClick={() => this.props.openLink(helpLink)}>
                  <Icon glyph='InfoWithCircle' />
                </button>
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
