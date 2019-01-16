import React, { PureComponent } from 'react';
import dropIndexStore from 'stores/drop-index';
import PropTypes from 'prop-types';

import classnames from 'classnames';
import styles from './drop-column.less';

/**
 * Component for the drop column.
 */
class DropColumn extends PureComponent {
  static displayName = 'DropColumn';

  static propTypes = {
    indexName: PropTypes.string.isRequired,
    isReadonly: PropTypes.bool.isRequired,
    toggleIsVisible: PropTypes.func.isRequired,
    changeName: PropTypes.func.isRequired
  };

  /**
   * Show drop index modal when drop button is clicked.
   *
   * @param {Object} evt - The click event.
   */
  clickDropHandler(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    dropIndexStore.dispatch(this.props.changeName(this.props.indexName));
    dropIndexStore.dispatch(this.props.toggleIsVisible(true));
  }

  /**
   * Render the drop column.
   *
   * @returns {React.Component} The drop column.
   */
  render() {
    return (
      <td className={classnames(styles['drop-column'])}>
        {this.props.indexName !== '_id_' && !this.props.isReadonly ?
          <button
            className="drop-btn btn btn-default btn-sm"
            type="button"
            onClick={this.clickDropHandler.bind(this)}>
            <i className="drop-column-icon fa fa-trash-o"/>
          </button>
          : null}
      </td>
    );
  }
}

export default DropColumn;
