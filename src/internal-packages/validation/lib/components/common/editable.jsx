const React = require('react');
const PropTypes = require('prop-types');
const { Button } = require('react-bootstrap');
const FontAwesome = require('react-fontawesome');

// const debug = require('debug')('mongodb-compass:validation:editable');

class Editable extends React.Component {

  getButtons() {
    if (this.props.editState === 'modified') {
      return (
        <div className="pull-right">
          <Button
            bsStyle="borderless"
            bsSize="xsmall"
            onClick={this.props.onCancel}>Cancel
          </Button>
          <Button
            bsSize="xsmall"
            bsStyle="edit"
            onClick={this.props.onUpdate}>Update
          </Button>
        </div>
      );
    }
    if (this.props.editState === 'error') {
      return (
        <div className="pull-right">
          <Button
            bsStyle="borderless"
            bsSize="xsmall"
            onClick={this.props.onCancel}>Cancel
          </Button>
        </div>
      );
    }
    return null;
  }

  getMessage() {
    /* eslint complexity: 0 */
    const name = this.props.childName;
    const errorMsg = this.props.errorMessage;

    switch (this.props.editState) {
      case 'unmodified': return '';
      case 'modified': return name ? `${name} modified` : 'Modified';
      case 'updating': return name ? `Updating ${name}...` : 'Updating...';
      case 'success': return name ? `${name} updated.` : 'Updated';
      case 'error':
        if (errorMsg) {
          return name ? `${name} could not be updated: ${errorMsg}` :
            `Error: ${errorMsg}`;
        }
        return name ? `${name} could not be updated.` : 'An error occurred during the update.';
      default: return '';
    }
  }

  getSymbol() {
    switch (this.props.editState) {
      case 'unmodified': return null;
      case 'modified': return null;
      case 'updating': return <FontAwesome name="spinner" spin/>;
      case 'success': return <FontAwesome name="check"/>;
      case 'error': return <FontAwesome name="exclamation-triangle"/>;
      default: return '';
    }
  }

  /**
   * Render view switcher component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const message = this.getMessage();
    const buttons = this.getButtons();
    const symbol = this.getSymbol();

    return (
      <div className={`editable editable-is-${this.props.editState}`}>
        <div className="editable-wrapper">
          <div className="editable-content" ref="content">
            {React.cloneElement(this.props.children, {ref: 'child'})}
          </div>
          <div className="editable-statusbar">
            <span>{symbol}&nbsp;{message}</span>
            {buttons}
          </div>
        </div>
      </div>
    );
  }
}

Editable.propTypes = {
  children: PropTypes.node.isRequired,
  editState: PropTypes.oneOf(['unmodified', 'modified', 'updating',
    'success', 'error']).isRequired,
  childName: PropTypes.string,
  onCancel: PropTypes.func,
  onUpdate: PropTypes.func,
  errorMessage: PropTypes.string
};

Editable.defaultProps = {
  editState: 'unmodified',
  onCancel: () => {},
  onUpdate: () => {}
};

Editable.displayName = 'Editable';

module.exports = Editable;
