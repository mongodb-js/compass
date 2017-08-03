const React = require('react');
const { StoreConnector } = require('hadron-react-components');
const CompassCrudComponent = require('./Compass CRUD');
const Store = require('../stores');
const Actions = require('../actions');

// const debug = require('debug')('mongodb-compass:compass-crud:index');

class ConnectedCompassCrudComponent extends React.Component {
  /**
   * Connect CompassCrudComponent to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={Store}>
        <CompassCrudComponent actions={Actions} {...this.props} />
      </StoreConnector>
    );
  }
}

ConnectedCompassCrudComponent.displayName = 'ConnectedCompassCrudComponent';

module.exports = ConnectedCompassCrudComponent;
