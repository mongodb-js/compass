const React = require('react');

class Connect extends React.Component {

  render() {
    return (
      <div className="page connect">
        <div>
          <div className="sidebar panel"></div>
        </div>
        <div className="form-container"></div>
      </div>
    );
  }
}

Connect.displayName = 'Connect';

module.exports = Connect;
