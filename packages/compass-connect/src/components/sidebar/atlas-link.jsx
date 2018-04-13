const React = require('react');
const Actions = require('../../actions');

class AtlasLink extends React.Component {

  onLinkClicked() {
    Actions.onVisitAtlasLink();
  }

  render() {
    return (
      <div className="connect-sidebar-atlas-link">
        <div className="connect-sidebar-header" onClick={this.onLinkClicked.bind(this)}>
          <i className="fa fa-fw fa-external-link" />
          <span>Create Atlas Cluster</span>
        </div>
      </div>
    );
  }
}

AtlasLink.displayName = 'AtlasLink';

module.exports = AtlasLink;
