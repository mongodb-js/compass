const React = require('react');
const PropTypes = require('prop-types');
const { OptionSelector } = require('hadron-react-components');
const ValidationActions = require('../actions');
const Editable = require('./common/editable');

const {Grid, Row, Col, FormGroup, FormControl} = require('react-bootstrap');

// const debug = require('debug')('validation:json-view');

class JSONView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isValidJSON: true,
      input: props.validatorDoc ?
        JSON.stringify(props.validatorDoc.validator, null, 2) : '{}'
    };
  }

  componentWillReceiveProps(newProps) {
    this.setState({
      input: JSON.stringify(newProps.validatorDoc.validator, null, 2)
    });
  }

  onInputChanged(evt) {
    this.setState({
      input: evt.target.value
    });
  }

  onBlur() {
    const doc = this.validate();
    if (doc) {
      ValidationActions.setValidatorDocument(doc);
    }
  }

  /**
   * New value from the validation action dropdown chosen.
   *
   * @param {String} action    the chosen action, one of `warn`, `error`.
   */
  onActionSelect(action) {
    ValidationActions.setValidationAction(action, false);
  }

  /**
   * New value from the validation level dropdown chosen.
   *
   * @param {String} level    the chosen level, one of `off`, `moderate`, `strict`
   */
  onLevelSelect(level) {
    ValidationActions.setValidationLevel(level, false);
  }

  /**
   * The "Cancel" button from the `Editable` component has been clicked.
   * Revert all changes to the server state.
   */
  onCancel() {
    this.setState({
      isValidJSON: true
    });
    ValidationActions.cancelChanges();
  }

  /**
   * The "Update" button from the `Editable component has been clicked.
   * Send the new validator doc to the server.
   */
  onUpdate() {
    ValidationActions.saveChanges();
  }

  validate() {
    try {
      const doc = {
        validator: JSON.parse(this.state.input),
        validationLevel: this.props.validationLevel,
        validationAction: this.props.validationAction
      };
      this.setState({
        isValidJSON: true
      });
      return doc;
    } catch (e) {
      this.setState({
        isValidJSON: false
      });
      return false;
    }
  }

  /**
   * Render status row component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const editableProps = {
      editState: this.props.editState,
      childName: 'Validation',
      onCancel: this.onCancel.bind(this),
      onUpdate: this.onUpdate.bind(this)
    };

    if (!this.state.isValidJSON) {
      editableProps.editState = 'error';
      editableProps.errorMessage = 'Input is not valid JSON.';
      delete editableProps.childName;
    }
    const actionOptions = {warn: 'Warning', error: 'Error'};
    const levelOptions = {off: 'Off', moderate: 'Moderate', strict: 'Strict'};

    return (
      <Editable {...editableProps} >
        <Grid fluid className="json-view">
          <Row className="header">
            <Col lg={12} md={12} sm={12} xs={12}>
              <div className="pull-right">
                <OptionSelector
                  id="validation-action-selector"
                  bsSize="xs"
                  options={actionOptions}
                  title={actionOptions[this.props.validationAction]}
                  label="Validation Action"
                  onSelect={this.onActionSelect.bind(this)}
                  disabled={!this.props.isWritable}
                />
                <OptionSelector
                  id="validation-level-selector"
                  bsSize="xs"
                  options={levelOptions}
                  title={levelOptions[this.props.validationLevel]}
                  label="Validation Level"
                  onSelect={this.onLevelSelect.bind(this)}
                  disabled={!this.props.isWritable}
                />
              </div>
            </Col>
          </Row>
          <hr/>
          <Row>
            <Col lg={12} md={12} sm={12} xs={12}>
              <FormGroup validationState={this.state.errorState}>
                <FormControl
                  componentClass="textarea"
                  className="json-input json-input-textarea"
                  value={this.state.input}
                  onChange={this.onInputChanged.bind(this)}
                  onBlur={this.onBlur.bind(this)}
                  disabled={!this.props.isWritable}
                />
              </FormGroup>
            </Col>
          </Row>
        </Grid>
      </Editable>
    );
  }
}

JSONView.propTypes = {
  editState: PropTypes.oneOf(['unmodified', 'modified', 'updating', 'error', 'success']).isRequired,
  validationAction: PropTypes.oneOf(['warn', 'error']).isRequired,
  validationLevel: PropTypes.oneOf(['off', 'moderate', 'strict']).isRequired,
  validatorDoc: PropTypes.object.isRequired,
  isWritable: PropTypes.bool
};

JSONView.defaultProps = {
  isWritable: false
};

JSONView.displayName = 'JSONView';

module.exports = JSONView;
