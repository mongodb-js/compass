const React = require('react');

class Connect extends React.Component {

  render() {
    return (
      <div className="page connect">
        <div>
          <div className="sidebar panel"></div>
        </div>
        <div className="form-container">
          <header>
            <h2 data-test-id="connect-header">Connect to Host</h2>
          </header>
          <form data-test-id="connect-form">
            <div id="host-port" className="form-group">
              <div className="form-item">
                <label>
                  <span>Hostname</span>
                </label>
                <input name="hostname" placeholder="localhost" className="form-control" type="text" />
              </div>
              <div className="form-item">
                <label>
                  <span>Port</span>
                </label>
                <input name="port" placeholder="27017" className="form-control" type="text" />
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

Connect.displayName = 'Connect';

module.exports = Connect;
