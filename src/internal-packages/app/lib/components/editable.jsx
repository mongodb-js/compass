const React = require('react');
const PropTypes = require('prop-types');
const { Button } = require('react-bootstrap');
const FontAwesome = require('react-fontawesome');

// const debug = require('debug')('mongodb-compass:validation:editable');

class Editable extends React.Component {

  getButtons() {
    if (this.props.editState === 'initial') {
      return (
        <div className="pull-right">
          <Button
            bsStyle="link"
            bsSize="xsmall"
            className="btn-default"
            disabled={this.props.disableButtons}
            onClick={this.props.onCancel}>Cancel
          </Button>
          <Button
            bsSize="xsmall"
            bsStyle="default"
            className="btn-primary"
            disabled={this.props.disableButtons}
            onClick={this.props.onUpdate}>{this.props.updateText}
          </Button>
        </div>
      );
    }
    if (this.props.editState === 'modified') {
      return (
        <div className="pull-right">
          <Button
            bsStyle="link"
            bsSize="xsmall"
            className="btn-borderless"
            disabled={this.props.disableButtons}
            onClick={this.props.onCancel}>Cancel
          </Button>
          <Button
            bsSize="xsmall"
            bsStyle="default"
            className="btn-edit"
            disabled={this.props.disableButtons}
            onClick={this.props.onUpdate}>{this.props.updateText}
          </Button>
        </div>
      );
    }
    if (this.props.editState === 'error') {
      return (
        <div className="pull-right">
          <Button
            bsStyle="link"
            bsSize="xsmall"
            className="btn-borderless"
            disabled={this.props.disableButtons}
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
      case 'initial': return '';
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
      case 'initial': return null;
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
          {!this.props.disableStatusBar ?
            <div className="editable-statusbar">
              <span>{symbol}&nbsp;{message}</span>
              {buttons}
            </div>
           : null}
        </div>
      </div>
    );
  }
}

Editable.propTypes = {
  children: PropTypes.node.isRequired,
  editState: PropTypes.oneOf(['initial', 'unmodified', 'modified', 'updating',
    'success', 'error']).isRequired,
  childName: PropTypes.string,
  onCancel: PropTypes.func,
  onUpdate: PropTypes.func,
  errorMessage: PropTypes.string,
  disableButtons: PropTypes.bool,
  updateText: PropTypes.string,
  disableStatusBar: PropTypes.bool
};

Editable.defaultProps = {
  editState: 'unmodified',
  onCancel: () => {},
  onUpdate: () => {},
  disableButtons: false,
  updateText: 'Update',
  disableStatusBar: false
};

Editable.displayName = 'Editable';

module.exports = Editable;
