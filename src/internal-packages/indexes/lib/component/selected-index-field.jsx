const React = require('react');
const Panel = require('react-bootstrap').Panel;
const Action = require('../action/index-actions');

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
        <div className="col-md-10">
          <Panel className="selected-index-panel">
            <div className="selected-index-panel-field">
              {this.props.field.name}
            </div>
            <div className="selected-index-panel-type">
              {this.props.field.type}
            </div>
          </Panel>
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
