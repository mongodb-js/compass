const React = require('react');
const Panel = require('react-bootstrap').Panel;
const Action = require('../action/index-actions');
const ButtonToolbar = require('react-bootstrap').ButtonToolbar;
const Button = require('react-bootstrap').Button;

/**
 * Component for the selected index field.
 */
class SelectedIndexField extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
  }

  /**
   * Fire drop field action when drop button is clicked.
   *
   * @param {Object} evt - The click event.
   */
  onClick(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    Action.updateField(this.props.field.name, this.props.field.type, 'drop');
  }

  /**
   * Render the selected index field form.
   *
   * @returns {React.Component} The selected index field form.
   */
  render() {
    return (
      <div className="row selected-index">
        <div className="col-md-6">
          <ButtonToolbar>
            <Button>{this.props.field.name}</Button>
          </ButtonToolbar>
        </div>
        <div className="col-md-4">
          <ButtonToolbar>
            <Button>{this.props.field.type}</Button>
          </ButtonToolbar>
        </div>
        <div className="col-md-2">
          <button
            className="btn btn-success btn-circle selected-index-btn"
            onClick={this.onClick.bind(this)}>
            <i className="fa fa-minus" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    );
  }
}

SelectedIndexField.displayName = 'SelectedIndexField';

SelectedIndexField.propTypes = {
  field: React.PropTypes.object.isRequired
};

module.exports = SelectedIndexField;
