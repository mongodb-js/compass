const React = require('react');
const app = require('ampersand-app');
const ValidationActions = require('../actions');
const OptionSelector = require('./common/option-selector');
const Rule = require('./rule');
const Editable = require('./common/editable');
const _ = require('lodash');

const ReactBootstrap = require('react-bootstrap');
const Grid = ReactBootstrap.Grid;
const Row = ReactBootstrap.Row;
const Col = ReactBootstrap.Col;
const Button = ReactBootstrap.Button;
const Table = ReactBootstrap.Table;

// const debug = require('debug')('validation:rule-builder');

class RuleBuilder extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isValid: true,
      forceRenderKey: 0
    };
    this.HadronTooltip = app.appRegistry.getComponent('App.HadronTooltip');
  }

  componentWillReceiveProps(props) {
    this.validate(false);
    if (props.editState === 'unmodified' && this.props.editState !== 'unmodified') {
      // force a complete redraw of the component by increasing the key
      this.setState({
        forceRenderKey: this.state.forceRenderKey + 1,
        isValid: true
      });
    }
  }

  /**
   * Add button clicked to create a new rule.
   */
  onAddClick() {
    ValidationActions.addValidationRule();
  }

  /**
   * New value from the validation action dropdown chosen.
   *
   * @param {String} action    the chosen action, one of `warn`, `error`.
   */
  onActionSelect(action) {
    ValidationActions.setValidationAction(action, true);
  }

  /**
   * New value from the validation level dropdown chosen.
   *
   * @param {String} level    the chosen level, one of `off`, `moderate`, `strict`
   */
  onLevelSelect(level) {
    ValidationActions.setValidationLevel(level, true);
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
   * Check that all rules are valid, then send the new validator doc to
   * the server.
   */
  onUpdate() {
    if (this.validate(true)) {
      ValidationActions.saveChanges();
    }
  }

  validate(force) {
    const isValid = _.all(this.props.validationRules, (rule) => {
      return this.refs[rule.id].validate(force);
    });
    this.setState({
      isValid: isValid
    });
    return isValid;
  }

  renderRules() {
    return _.map(this.props.validationRules, (rule) => {
      return (<Rule ref={rule.id}
        key={rule.id}
        isWritable={this.props.isWritable}
        serverVersion={this.props.serverVersion}
        {...rule} />);
    });
  }

  renderAddButton() {
    return (
      <Button
        bsStyle="success"
        bsSize="xsmall"
        disabled={!this.props.isWritable}
        onClick={this.onAddClick.bind(this)}>+ Add Rule
      </Button>);
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
      onUpdate: this.onUpdate.bind(this),
      key: this.state.forceRenderKey
    };

    if (!this.state.isValid) {
      editableProps.editState = 'error';
      editableProps.errorMessage = 'Input is not valid.';
      delete editableProps.childName;
    }

    const tooltipId = 'validation-rule-is-not-writable';
    const isNotWritableTooltip = this.props.isWritable ? null : (
      <this.HadronTooltip
        id={tooltipId}
      />
    );
    const tooltipText = 'This action is not available on a secondary node';

    return (
      <Editable {...editableProps} >
        <Grid fluid className="rule-builder">
          <Row className="header">
            <Col lg={6} md={6} sm={6} xs={6}>
              <div className="tooltip-button-wrapper" data-tip={tooltipText} data-for={tooltipId}>
                {this.renderAddButton()}
              </div>
              {isNotWritableTooltip}
            </Col>
            <Col lg={6} md={6} sm={6} xs={6}>
              <div className="pull-right">
                <OptionSelector
                  id="validation-action-selector"
                  bsSize="xs"
                  options={{warn: 'Warning', error: 'Error'}}
                  value={this.props.validationAction}
                  label="validation action:"
                  disabled={!this.props.isWritable}
                  onSelect={this.onActionSelect.bind(this)}
                />
                <OptionSelector
                  id="validation-level-selector"
                  bsSize="xs"
                  options={{off: 'Off', moderate: 'Moderate', strict: 'Strict'}}
                  value={this.props.validationLevel}
                  label="validation level:"
                  disabled={!this.props.isWritable}
                  onSelect={this.onLevelSelect.bind(this)}
                />
              </div>
            </Col>
          </Row>
          <hr/>
          <Row>
            <Col lg={12} md={12} sm={12} xs={12}>
              <Table className="rule-builder-table">
                <thead>
                  <tr>
                    <th className="name-column">Field Name</th>
                    <th className="rule-column">Rule</th>
                    <th className="null-column">Nullable</th>
                    <th className="ctrl-column"></th>
                  </tr>
                </thead>
                <tbody>
                  {this.renderRules()}
                </tbody>
              </Table>
            </Col>
          </Row>
        </Grid>
      </Editable>
    );
  }
}

RuleBuilder.propTypes = {
  editState: React.PropTypes.oneOf(['unmodified', 'modified', 'updating', 'error', 'success']).isRequired,
  validationAction: React.PropTypes.oneOf(['warn', 'error']).isRequired,
  validationLevel: React.PropTypes.oneOf(['off', 'moderate', 'strict']).isRequired,
  validationRules: React.PropTypes.array.isRequired,
  serverVersion: React.PropTypes.string.isRequired,
  isWritable: React.PropTypes.bool.isRequired
};

RuleBuilder.displayName = 'RuleBuilder';

module.exports = RuleBuilder;
