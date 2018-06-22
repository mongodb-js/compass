const React = require('react');
const Actions = require('../actions');

class AtlasLink extends React.Component {

  onLinkClicked() {
    Actions.onVisitAtlasLink();
  }

  onLearnLinkClicked() {
    Actions.onAtlasLearnMore();
  }

  render() {
    return (
      <div className="connect-atlas">
        <div
          className="connect-atlas-link"
          onClick={this.onLinkClicked.bind(this)}>
          <i className="fa fa-fw fa-external-link" />
          Create free Atlas cluster
        </div>
        <div>
          <div className="connect-atlas-includes">
            Includes 512 MB of data storage.
          </div>
          <div
            className="connect-atlas-learn-more"
            onClick={this.onLearnLinkClicked.bind(this)}>
            Learn more
          </div>
        </div>
      </div>
    );
  }
}

AtlasLink.displayName = 'AtlasLink';

module.exports = AtlasLink;
