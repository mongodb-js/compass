import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { spacing, css, Body, IndexKeys } from '@mongodb-js/compass-components';

const containerStyles = css({
  paddingLeft: spacing[4],
  paddingBottom: spacing[3],
  position: 'relative',
  width: '35%',
});

const indexKeyStyles = css({
  marginTop: spacing[1],
});

class NameColumn extends PureComponent {
  static displayName = 'NameColumn';

  static propTypes = {
    index: PropTypes.object.isRequired,
  };

  render() {
    const indexKeys = {};
    const indexName = this.props.index.name;
    this.props.index.fields.serialize().forEach(({ field, value }) => {
      indexKeys[field] = value;
    });
    return (
      <td className={containerStyles}>
        <div className="index-definition">
          <Body data-testid="name-column-name">{indexName}</Body>
          <div className={indexKeyStyles}>
            <IndexKeys keys={indexKeys} />
          </div>
        </div>
      </td>
    );
  }
}

export default NameColumn;
