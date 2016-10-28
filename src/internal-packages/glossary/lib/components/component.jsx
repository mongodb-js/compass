const React = require('react');

class Component extends React.Component {
  render() {
    return (
      <div>
        <h3>{this.props.name}</h3>
        {
          Object.keys(this.props.states).map(state => {
            return this.props.states[state]();
          })
        }
      </div>
    );
  }
}

Component.propTypes = {
  name: React.PropTypes.string,
  states: React.PropTypes.object
};

module.exports = Component;
