const React = require('react');
const PropTypes = require('prop-types');
const CompassCrudActions = require('../actions');
const ToggleButton = require('./toggle-button');

// const debug = require('debug')('mongodb-compass:compass-crud');

class CompassCrudComponent extends React.Component {

  onClick() {
    CompassCrudActions.toggleStatus();
  }

  /**
   * Render CompassCrud component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className="compass-crud">
        <h2 className="compass-crud-title">CompassCrudComponent</h2>
        <p><i>Compass Plugin for CRUD Operations</i></p>
        <p>The current status is: <code>{this.props.status}</code></p>
        <ToggleButton onClick={this.onClick} />
      </div>
    );
  }
}

CompassCrudComponent.propTypes = {
  status: PropTypes.oneOf(['enabled', 'disabled'])
};

CompassCrudComponent.defaultProps = {
  status: 'enabled'
};

CompassCrudComponent.displayName = 'CompassCrudComponent';

module.exports = CompassCrudComponent;
