import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ViewSwitcher } from 'hadron-react-components';

import styles from './header.module.less';
import { Icon, IconButton, css } from '@mongodb-js/compass-components';


const closeButtonStyles = css({
  marginLeft: 'auto'
});

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
      <div className={styles.component}>
        <ViewSwitcher
          dataTestId="past-queries"
          label="Past Queries"
          buttonLabels={['Recent', 'Favorites']}
          activeButton={activeButton}
          onClick={this.onViewSwitch}
        />
        <IconButton
          className={closeButtonStyles}
          data-test-id="query-history-button-close-panel"
          onClick={this.collapse}
          aria-label="Close query history"
        >
          <Icon glyph="X" />
        </IconButton>
      </div>
    );
  }
}

export default Header;
export { Header };
