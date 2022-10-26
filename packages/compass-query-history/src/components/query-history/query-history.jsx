import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import mongodbns from 'mongodb-ns';
import { StoreConnector } from 'hadron-react-components';

// Components
import { Toolbar } from '../toolbar/toolbar';
import { RecentList } from '../recent';
import { FavoriteList } from '../favorite';

import { css } from '@mongodb-js/compass-components';

const componentStyle = css({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  width: '335px',
  height: '100%',
});

const innerStyle = css({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  height: '100%',
});

class QueryHistory extends PureComponent {
  static displayName = 'QueryHistory';

  static propTypes = {
    actions: PropTypes.object.isRequired,
    store: PropTypes.object.isRequired,
    showing: PropTypes.oneOf(['recent', 'favorites']),
    ns: PropTypes.object,
  };

  static defaultProps = {
    showing: 'recent',
    ns: mongodbns(''),
  };

  renderFavorites = () => (
    <StoreConnector
      store={this.props.store.localAppRegistry.getStore(
        'QueryHistory.FavoriteListStore'
      )}
    >
      <FavoriteList
        data-testid="query-history-list-favorites"
        ns={this.props.ns}
        actions={this.props.actions}
      />
    </StoreConnector>
  );

  renderRecents = () => (
    <StoreConnector
      store={this.props.store.localAppRegistry.getStore(
        'QueryHistory.RecentListStore'
      )}
    >
      <RecentList
        data-testid="query-history-list-recent"
        ns={this.props.ns}
        actions={this.props.actions}
      />
    </StoreConnector>
  );

  render() {
    const { ns, showing, actions } = this.props;

    return (
      <div data-testid="query-history" className={componentStyle}>
        <div className={innerStyle}>
          <Toolbar actions={actions} showing={showing} namespace={ns} />

          {showing === 'favorites' ? this.renderFavorites() : null}
          {showing === 'recent' ? this.renderRecents() : null}
        </div>
      </div>
    );
  }
}

export default QueryHistory;
export { QueryHistory };
