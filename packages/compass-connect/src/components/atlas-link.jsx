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
          Create a free MongoDB Atlas cluster
        </div>
        <div className="connect-atlas-includes">
          Includes 512 MB of data storage.
          <span
            className="connect-atlas-learn-more"
            onClick={this.onLearnLinkClicked.bind(this)}>
            Learn more
          </span>
        </div>
      </div>
    );
  }
}

AtlasLink.displayName = 'AtlasLink';

module.exports = AtlasLink;
