import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '@leafygreen-ui/button';
import Icon from '@leafygreen-ui/icon';

import CollectionsPlugin from '../../../../src/collections-plugin';
import DatabasePlugin from '../../../../src/databases-plugin';

import styles from './databases-collections.less';

const VIEWS = {
  OPTIONS: 'OPTIONS',
  DATABASES: 'DATABASES',
  COLLECTIONS: 'COLLECTIONS'
};

class DatabasesCollections extends Component {
  static displayName = 'DatabasesCollectionsComponent';

  static propTypes = {
    appRegistry: PropTypes.object.isRequired,
    store: PropTypes.object.isRequired
  };

  state = {
    view: VIEWS.OPTIONS
  };

  onClickDatabasesButton = () => {
    this.setState({
      view: VIEWS.DATABASES
    });
  };

  onClickCollectionsButton = () => {
    this.setState({
      view: VIEWS.COLLECTIONS
    });
  };

  onClickResetView = () => {
    this.setState({
      view: VIEWS.OPTIONS
    });
  }

  renderViewOptions() {
    return (
      <div className={styles['databases-collections']}>
        <Button
          onClick={this.onClickDatabasesButton}
          darkMode
        >Databases</Button>
        <Button
          onClick={this.onClickCollectionsButton}
          darkMode
        >Collections</Button>
      </div>
    );
  }

  render() {
    const { view } = this.state;

    if (view === VIEWS.OPTIONS) {
      return this.renderViewOptions();
    }

    return (
      <div className={styles['databases-collections-view']}>
        <div className={styles['databases-collections-topbar']}>
          <Button
            onClick={this.onClickResetView}
            darkMode
            size="small"
            leftGlyph={<Icon glyph="ChevronLeft" />}
          >Back</Button>
        </div>
        <div className={styles['databases-collections-content']}>
          {view === VIEWS.DATABASES && <DatabasePlugin />}
          {view === VIEWS.COLLECTIONS && <CollectionsPlugin />}
        </div>
      </div>
    );
  }
}

export default DatabasesCollections;
