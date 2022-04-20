import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import classnames from 'classnames';
import styles from './drop-column.module.less';

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
      <td className={classnames(styles['drop-column'])}>
        {this.isDroppable() ? (
          <button
            className="drop-btn btn btn-default btn-sm"
            type="button"
            onClick={this.clickDropHandler.bind(this)}
          >
            <i className="drop-column-icon fa fa-trash-o" />
          </button>
        ) : null}
      </td>
    );
  }
}

export default DropColumn;
