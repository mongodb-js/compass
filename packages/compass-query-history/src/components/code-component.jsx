const React = require('react');
const ReactDOM = require('react-dom');
const PropTypes = require('prop-types');
const highlight = require('highlight.js');

/**
 * A component to display code highlighted by highlight.js
 */
class CodeComponent extends React.Component {

  /**
   * Highlight on mount.
   */
  componentDidMount() {
    highlight.highlightBlock(ReactDOM.findDOMNode(this.refs.code));
  }

  /**
   * Render CodeComponent.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <pre>
        <code className={this.props.language} ref="code">
          {this.props.code}
        </code>
      </pre>
    );
  }
}

CodeComponent.propTypes = {
  code: PropTypes.string.isRequired,
  language: PropTypes.string.isRequired
};

CodeComponent.displayName = 'CodeComponent';

module.exports = CodeComponent;
