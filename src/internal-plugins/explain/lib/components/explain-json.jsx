const React = require('react');
const PropTypes = require('prop-types');
const app = require('hadron-app');

class ExplainJSON extends React.Component {

  componentWillMount() {
    this.documentComponent = app.appRegistry.getRole('CRUD.Document')[0].component;
  }

  /**
   * Render Summary Component.
   *
   * @returns {React.Component} The Summary part of the explain view.
   */
  render() {
    return (
      <div className="explain-json">
        <div className="panel panel-default">
          <div className="panel-body">
            <ol className="document-list">
              <this.documentComponent doc={this.props.rawExplainObject} expandAll />
            </ol>
          </div>
        </div>
      </div>
    );
  }
}

ExplainJSON.propTypes = {
  rawExplainObject: PropTypes.object.isRequired
};

ExplainJSON.displayName = 'ExplainJSON';

module.exports = ExplainJSON;
