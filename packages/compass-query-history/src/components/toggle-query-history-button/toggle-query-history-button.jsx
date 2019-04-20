import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import FontAwesome from 'react-fontawesome';
import Actions from 'actions';
import ReactTooltip from 'react-tooltip';

import styles from './toggle-query-history-button.less';

class ToggleQueryHistoryButton extends PureComponent {
  static displayName = 'ToggleQueryHistoryButton';

  static propTypes = {
    onClick: PropTypes.func
  };

  static defaultProps = {};

  handleCollapse = () => {
    Actions.toggleCollapse();
  };

  render() {
    return (
      <button
        id="query_history_button"
        key="query-history-button"
        className={classnames('btn', 'btn-default', 'btn-sm', styles.component)}
        data-test-id="query-history-button"
        type="button"
        onClick={this.handleCollapse}
        data-tip="Past and Favorite Queries">
        <FontAwesome
          data-test-id="query-history-button-icon"
          name="history"
          className="query-history-button-icon"
        />
        <ReactTooltip
          place="top"
          type="dark"
          effect="solid"
          className={styles.tooltip}/>
      </button>
    );
  }
}

export default ToggleQueryHistoryButton;
export { ToggleQueryHistoryButton };
