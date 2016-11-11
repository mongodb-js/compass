const app = require('ampersand-app');
const React = require('react');
const Sidebar = require('./sidebar');

const GlossaryContent = require('./content.jsx');
const GlossaryStore = require('../stores');
const StoreConnector = app.appRegistry.getComponent('App.StoreConnector');

// const app = require('ampersand-app');

class Glossary extends React.Component {
  render() {
    return (
      <div className="glossary">
        <div className="compass-sidebar-container">
          <Sidebar />
        </div>
        <div className="layout-container">
          <div className="layout">
            <StoreConnector store={GlossaryStore}>
              <GlossaryContent />
            </StoreConnector>
          </div>
        </div>
      </div>
    );
  }
}

module.exports = Glossary;
