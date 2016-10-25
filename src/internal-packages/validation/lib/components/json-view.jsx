const React = require('react');
const ValidationActions = require('../actions');
const OptionSelector = require('./common/option-selector');
const Editable = require('./common/editable');

const ReactBootstrap = require('react-bootstrap');
const Grid = ReactBootstrap.Grid;
const Row = ReactBootstrap.Row;
const Col = ReactBootstrap.Col;

// const debug = require('debug')('validation:json-view');

class JSONView extends React.Component {

  /**
   * New value from the validation action dropdown chosen.
   *
   * @param {String} action    the chosen action, one of `warn`, `error`.
   */
  onActionSelect(action) {
    ValidationActions.setValidationAction(action);
  }

  /**
   * New value from the validation level dropdown chosen.
   *
   * @param {String} level    the chosen level, one of `off`, `moderate`, `strict`
   */
  onLevelSelect(level) {
    ValidationActions.setValidationLevel(level);
  }

  /**
   * The "Cancel" button from the `Editable` component has been clicked.
   * Revert all changes to the server state.
   */
  onCancel() {
    ValidationActions.cancelChanges();
  }

  /**
   * The "Update" button from the `Editable component has been clicked.
   * Send the new validator doc to the server.
   */
  onUpdate() {
    ValidationActions.saveChanges();
  }

  /**
   * Render status row component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <Editable
        editState={this.props.editState}
        childName="Validation"
        onCancel={this.onCancel.bind(this)}
        onUpdate={this.onUpdate.bind(this)}
      >
        <Grid fluid className="rule-builder">
          <Row className="header">
            <Col lg={6} md={6} sm={6} xs={6}>
              Read-only JSON rule builder view
            </Col>
            <Col lg={6} md={6} sm={6} xs={6}>
              <div className="pull-right">
                <OptionSelector
                  id="validation-action-selector"
                  bsSize="xs"
                  options={{warn: 'Warning', error: 'Error'}}
                  value={this.props.validationAction}
                  label="validation action:"
                  onSelect={this.onActionSelect.bind(this)}
                />
                <OptionSelector
                  id="validation-level-selector"
                  bsSize="xs"
                  options={{off: 'Off', moderate: 'Moderate', strict: 'Strict'}}
                  value={this.props.validationLevel}
                  label="validation level:"
                  onSelect={this.onLevelSelect.bind(this)}
                />
              </div>
            </Col>
          </Row>
          <hr/>
          <Row>
            <Col lg={12} md={12} sm={12} xs={12}>
              <textarea
                cols="80"
                rows="10"
                readOnly="readOnly"
                disabled="disabled"
                style={{backgroundColor:'rgb(236, 236, 236)'}}
                value={JSON.stringify(this.props.validatorDoc)}
              />
            </Col>
          </Row>
          <hr/>
        </Grid>
      </Editable>
    );
  }
}

JSONView.propTypes = {
  editState: React.PropTypes.oneOf(['unmodified', 'modified', 'updating', 'error', 'success']).isRequired,
  validationAction: React.PropTypes.oneOf(['warn', 'error']).isRequired,
  validationLevel: React.PropTypes.oneOf(['off', 'moderate', 'strict']).isRequired,
  validatorDoc: React.PropTypes.object.isRequired
};

JSONView.displayName = 'JSONView';

module.exports = JSONView;
