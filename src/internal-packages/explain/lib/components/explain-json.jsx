const React = require('react');
const app = require('ampersand-app');

// const debug = require('debug')('mongodb-compass:explain:summary');


class ExplainJSON extends React.Component {

  componentWillMount() {
    this.documentComponent = app.appRegistry.getComponent('Component::CRUD::Document');
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
              <this.documentComponent doc={this.props.rawExplainObject} editable={false} />
            </ol>
          </div>
        </div>
      </div>
    );
  }
}

ExplainJSON.propTypes = {
  rawExplainObject: React.PropTypes.object.isRequired
};

ExplainJSON.displayName = 'ExplainJSON';

module.exports = ExplainJSON;
