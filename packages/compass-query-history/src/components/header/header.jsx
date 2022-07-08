import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { ViewSwitcher } from 'hadron-react-components';

import styles from './header.module.less';

class Header extends PureComponent {
  static displayName = 'QueryHistoryHeader';

  static propTypes = {
    onViewSwitchClick: PropTypes.func.isRequired,
    onCollapseClick: PropTypes.func.isRequired,
    currentView: PropTypes.oneOf(['Recent', 'Favorites']).isRequired
  };

  render() {
    return (
      <div className={classnames(styles.component)}>
        <ViewSwitcher
          dataTestId="past-queries"
          label="Past Queries"
          buttonLabels={['Recent', 'Favorites']}
          activeButton={this.props.currentView}
          onClick={this.props.onViewSwitchClick} />
        <span
          className={classnames(styles.close)}
          data-test-id="query-history-button-close-panel"
          href="#"
          onClick={this.props.onCollapseClick}>
          ×
        </span>
      </div>
    );
  }
}

export default Header;
export { Header };
