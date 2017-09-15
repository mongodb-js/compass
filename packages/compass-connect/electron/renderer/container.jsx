const React = require('react');
const ConnectComponent = require('../../lib/components');

class Container extends React.Component {
  render() {
    const Status = global.hadronApp.appRegistry.getRole('Application.Status')[0].component;
    return (
      <div>
        <Status />
        <ConnectComponent />
      </div>
    );
  }
}

module.exports = Container;
