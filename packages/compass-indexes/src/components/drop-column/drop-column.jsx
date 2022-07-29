import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { css, spacing, IconButton, Icon } from '@mongodb-js/compass-components';

const containerStyles = css({
  padding: spacing[2],
  marginRight: spacing[2],
});

/**
 * Component for the drop column.
 */
class DropColumn extends PureComponent {
  static displayName = 'DropColumn';

  static propTypes = {
    indexName: PropTypes.string.isRequired,
    isReadonly: PropTypes.bool.isRequired,
    isWritable: PropTypes.bool.isRequired,
    localAppRegistry: PropTypes.object.isRequired,
  };

  /**
   * Show drop index modal when drop button is clicked.
   *
   * @param {Object} evt - The click event.
   */
  clickDropHandler(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.props.localAppRegistry.emit(
      'toggle-drop-index-modal',
      true,
      this.props.indexName
    );
  }

  /**
   * Is the index droppable?
   *
   * @returns {Boolean} If the index can be dropped.
   */
  isDroppable() {
    return (
      this.props.isWritable &&
      this.props.indexName !== '_id_' &&
      !this.props.isReadonly
    );
  }

  /**
   * Render the drop column.
   *
   * @returns {React.Component} The drop column.
   */
  render() {
    return (
      <td className={containerStyles}>
        {this.isDroppable() ? (
          <IconButton
            aria-label="Delete Index"
            onClick={this.clickDropHandler.bind(this)}
          >
            <Icon glyph="Trash" />
          </IconButton>
        ) : null}
      </td>
    );
  }
}

export default DropColumn;
