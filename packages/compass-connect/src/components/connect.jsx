const React = require('react');
const FormItem = require('./form-item');

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
              <FormItem label="Hostname" name="hostname" placeholder="localhost" />
              <FormItem label="Port" name="port" placeholder="27017" />
            </div>
          </form>
        </div>
      </div>
    );
  }
}

Connect.displayName = 'Connect';

module.exports = Connect;
