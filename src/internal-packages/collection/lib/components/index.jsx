const React = require('react');
const app = require('ampersand-app');
const StoreConnector = app.appRegistry.getComponent('App.StoreConnector');

const Stats = require('./stats');
const Store = require('../stores');

// const debug = require('debug')('mongodb-compass:validation:index');

class Collection extends React.Component {

  render() {
    return (
      <StoreConnector store={Store}>
        <Stats />
      </StoreConnector>
    );
  }
}

Collection.displayName = 'Collection';

module.exports = Collection;
