const React = require('react');
const Actions = require('../actions');
const FormItem = require('./form-item');

class Connect extends React.Component {

  onHostnameChanged(evt) {
    Actions.onHostnameChanged(evt.target.value);
  }

  onPortChanged(evt) {
    Actions.onPortChanged(evt.target.value);
  }

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
              <FormItem
                label="Hostname"
                name="hostname"
                placeholder="localhost"
                changeHandler={this.onHostnameChanged.bind(this)} />
              <FormItem
                label="Port"
                name="port"
                placeholder="27017"
                changeHandler={this.onPortChanged.bind(this)} />
            </div>
          </form>
        </div>
      </div>
    );
  }
}

Connect.displayName = 'Connect';

module.exports = Connect;
