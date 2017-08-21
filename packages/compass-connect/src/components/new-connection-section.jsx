const React = require('react');
const Actions = require('../actions');

class NewConnectionSection extends React.Component {

  onNewConnectionClicked() {
    Actions.resetConnection();
  }

  render() {
    return (
      <div className="widget-container">
        <ul className="list-group root">
          <li className="list-group-item-heading active">
            <a onClick={this.onNewConnectionClicked.bind(this)}>
              <i className="icon fa fa-fw fa-bolt" />
              <span>New Connection</span>
            </a>
          </li>
        </ul>
      </div>
    );
  }
}

NewConnectionSection.displayName = 'NewConnectionSection';

module.exports = NewConnectionSection;
