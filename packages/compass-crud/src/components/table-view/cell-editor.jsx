const React = require('react');
const PropTypes = require('prop-types');
// const _ = require('lodash');
const util = require('util');
const ReactDOM = require('react-dom');
const initEditors = require('../editor/');


/**
 * The custom cell editor for the table view.
 */
class CellEditor extends React.Component {
  constructor(props) {
    super(props);
    this.element = props.value;

    this.onKeyDown = this.onKeyDown.bind(this);
    this.handleChange = this.handleChange.bind(this);

    this._editors = initEditors(props.value);
  }

  componentDidMount() {
    this.props.reactContainer.addEventListener('keydown', this.onKeyDown);
    this.focus();
  }

  componentDidUpdate() {
    this.focus();
  }

  componentWillUnmount() {
    this.props.reactContainer.removeEventListener('keydown', this.onKeyDown);
    this.blur();
  }

  /**
   * This is only required if you are preventing event propagation.
   * @param {Object} event
   */
  onKeyDown(event) {
  }

  getValue() {
    return this.editor().value();
  }

  /**
   * Get the editor for the current type.
   *
   * @returns {Editor} The editor.
   */
  editor() {
    return this._editors[this.element.currentType] || this._editors.Standard;
  }

  blur() {
    this.editor().complete();
  }

  handleChange(event) {
    this.editor().edit(event.target.value);
    this.forceUpdate();
  }

  focus() {
    this.editor().start();

    // TODO: why this?
    setTimeout(() => {
      const container = ReactDOM.findDOMNode(this.props.reactContainer);
      if (container) {
        container.focus();
      }
    });
  }

  render() {
    return (
      <input ref="input"
             value={this.editor().value(true)}
             onChange={this.handleChange}
      />
    );
  }
}

CellEditor.propTypes = {
  reactContainer: PropTypes.any,
  value: PropTypes.any
};

CellEditor.displayName = 'CellEditor';

module.exports = CellEditor;
