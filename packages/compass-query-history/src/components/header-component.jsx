const React = require('react');
const PropTypes = require('prop-types');

const Actions = require('../actions');

// const debug = require('debug')('mongodb-compass:query-history:header-component');

class HeaderComponent extends React.Component {
  constructor(props) {
    super(props);
    this.showRecent = this.showRecent.bind(this);
    this.showFavorites = this.showFavorites.bind(this);
  }

  showRecent() {
    if (this.props.showing !== 'recent') {
      Actions.showRecent();
    }
  }

  showFavorites() {
    if (this.props.showing !== 'favorites') {
      Actions.showFavorites();
    }
  }

  collapse() {
    Actions.collapse();
  }

  /**
   * Render HeaderComponent.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className="query-history-header-component">
        <p>Past Queries (Header.props.showing={this.props.showing})</p>
        <ul>
          <li id="RECENT">
            <span href="#" onClick={this.showRecent}>RECENT</span>
          </li>
          <li id="FAVORITES">
            <span href="#" onClick={this.showFavorites}>FAVORITES</span>
          </li>
          <li id="COLLAPSE">
            <span href="#" onClick={this.collapse}>X</span>
          </li>
        </ul>
      </div>
    );
  }
}

HeaderComponent.propTypes = {
  showing: PropTypes.oneOf(['recent', 'favorites'])
};

HeaderComponent.defaultProps = {
  showing: 'recent'
};

HeaderComponent.displayName = 'QueryHistoryHeaderComponent';

module.exports = HeaderComponent;
