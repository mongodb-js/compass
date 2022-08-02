import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import NameColumn from '../name-column';
import TypeColumn from '../type-column';
import SizeColumn from '../size-column';
import UsageColumn from '../usage-column';
import PropertyColumn from '../property-column';
import DropColumn from '../drop-column';

import { css, uiColors } from '@mongodb-js/compass-components';

const containerStyles = css({
  height: '80px',
  backgroundColor: uiColors.white,
  boxShadow: '0 2px 10px 0 rgba(0, 0, 0, 0.075)',
});

/**
 * Component for the index.
 */
class IndexComponent extends PureComponent {
  static displayName = 'IndexComponent';
  static propTypes = {
    index: PropTypes.object.isRequired,
    isReadonly: PropTypes.bool.isRequired,
    isWritable: PropTypes.bool.isRequired,
    localAppRegistry: PropTypes.object.isRequired,
    changeName: PropTypes.func.isRequired,
    openLink: PropTypes.func.isRequired,
  };

  /**
   * Render the index.
   *
   * @returns {React.Component} The index.
   */
  render() {
    return (
      <tr
        className={containerStyles}
        data-test-id={`index-component-${this.props.index.name}`}
      >
        <NameColumn index={this.props.index} />
        <TypeColumn index={this.props.index} openLink={this.props.openLink} />
        <SizeColumn
          size={this.props.index.size}
          relativeSize={this.props.index.relativeSize}
        />
        <UsageColumn
          usage={this.props.index.usageCount}
          since={this.props.index.usageSince}
        />
        <PropertyColumn
          index={this.props.index}
          openLink={this.props.openLink}
        />
        <DropColumn
          indexName={this.props.index.name}
          isReadonly={this.props.isReadonly}
          isWritable={this.props.isWritable}
          localAppRegistry={this.props.localAppRegistry}
          changeName={this.props.changeName}
        />
      </tr>
    );
  }
}

export default IndexComponent;
