const React = require('react');

// const debug = require('debug')('mongodb-compass:explain:summary');


class ExplainJSON extends React.Component {

  /**
   * Render Summary Component.
   *
   * @returns {React.Component} The Summary part of the explain view.
   */
  render() {
    const propsStr = JSON.stringify(this.props, null, ' ');
    return (
      <div className="explain-json">
        <pre className="explain-json-pre">
          <code>
            {propsStr}
          </code>
        </pre>
      </div>
    );
  }
}

ExplainJSON.propTypes = {
  rawExplainObject: React.PropTypes.object.isRequired
};

ExplainJSON.displayName = 'ExplainJSON';

module.exports = ExplainJSON;
