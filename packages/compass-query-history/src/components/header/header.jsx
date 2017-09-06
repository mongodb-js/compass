import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import FontAwesome from 'react-fontawesome';
import { ViewSwitcher } from 'hadron-react-components';

import styles from './header.less';

class Header extends PureComponent {
  static displayName = 'QueryHistoryHeader';

  static propTypes = {
    actions: PropTypes.object.isRequired,
    showing: PropTypes.oneOf(['recent', 'favorites']).isRequired
  };

  static defaultProps = {
    showing: 'recent'
  };

  onViewSwitch = (label) => {
    if (label === 'Recent') {
      this.showRecent();
    } else if (label === 'Favorites') {
      this.showFavorites();
    }
  };

  showRecent = () => {
    const { showing, actions } = this.props;

    if (showing !== 'recent') {
      actions.showRecent();
    }
  };

  showFavorites = () => {
    const { showing, actions } = this.props;

    if (showing !== 'favorites') {
      actions.showFavorites();
    }
  }

  collapse = () => {
    this.props.actions.collapse();
  };

  render() {
    const { showing } = this.props;
    const activeButton = showing === 'recent' ? 'Recent' : 'Favorites';

    return (
      <div className={classnames(styles.component)}>
        <ViewSwitcher
          label="Past Queries"
          buttonLabels={['Recent', 'Favorites']}
          activeButton={activeButton}
          onClick={this.onViewSwitch}
        />
        <span className={classnames(styles.close)}
              data-test-id="query-history-button-close-panel"
              href="#"
              onClick={this.collapse}>
          <FontAwesome name="times"/>
        </span>
      </div>
    );
  }
}

export default Header;
export { Header };
