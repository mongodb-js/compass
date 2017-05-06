const React = require('react');
const PropTypes = require('prop-types');

// const debug = require('debug')('mongodb-compass:server-version');

class ServerVersionComponent extends React.Component {

  /**
   * Render RefluxCapacitor.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    if (this.props.versionNumber === '' || this.props.versionDistro === '') {
      return null;
    }
    return (
      <div className="server-version">
        MongoDB {this.props.versionNumber} {this.props.versionDistro}
      </div>
    );
  }
}

ServerVersionComponent.propTypes = {
  versionNumber: PropTypes.string,
  versionDistro: PropTypes.oneOf(['', 'Enterprise', 'Community'])
};

ServerVersionComponent.defaultProps = {
  versionNumber: '',
  versionDistro: ''
};

ServerVersionComponent.displayName = 'ServerVersionComponent';

module.exports = ServerVersionComponent;
