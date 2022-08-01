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
  IconBadge,
} from '@mongodb-js/compass-components';

const containerStyles = css({
  width: 'auto',
  paddingLeft: spacing[4],
  paddingRight: spacing[4],
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
              <IconBadge
                text={this.props.index.type}
                icon={'InfoWithCircle'}
                onClick={() => this.props.openLink(helpLink)}
              />
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
