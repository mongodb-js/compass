const React = require('react');
const ValidationActions = require('../actions');
const StatusRow = require('./common/status-row');
const ViewSwitcher = require('./common/view-switcher');
const RuleBuilder = require('./rule-builder');
const JSONView = require('./json-view');

const Grid = require('react-bootstrap').Grid;

// const debug = require('debug')('mongodb-compass:validation');

/**
 * Top-level Validation component which includes status rows at the top,
 * the ViewSwitcher element to toggle Rule Builder vs. Raw JSON editor view,
 * and the actual view.
 */
class Validation extends React.Component {

  /**
   * fetch validation rules on mount
   */
  componentWillMount() {
    ValidationActions.fetchValidationRules();
  }

  /**
   * The view switcher was clicked, switch to the correct view.
   *
   * @param {String} viewName   Name of the clicked view: `Rule Builder` or `JSON`
   */
  switchView(viewName) {
    ValidationActions.switchView(viewName);
  }

  /**
   * Render ValidationComponent
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const view = this.props.viewMode === 'Rule Builder' ?
      (
        <RuleBuilder
          validationRules={this.props.validationRules}
          validationAction={this.props.validationAction}
          validationLevel={this.props.validationLevel}
          editState={this.props.editState}
        />
      ) : (
        <JSONView
          validatorDoc={this.props.validatorDoc}
          validationAction={this.props.validationAction}
          validationLevel={this.props.validationLevel}
          editState={this.props.editState}
        />
      );

    const activeButton = this.props.isExpressibleByRules ?
      this.props.viewMode : 'JSON';

    return (
      <div className="validation">
        <Grid fluid>
          <StatusRow>
            <span>This is an example status row with a link.</span>
            {' '}
            <a href="#">more info</a>
          </StatusRow>
          <StatusRow>
            <ViewSwitcher
              label="View as:"
              buttonLabels={['Rule Builder', 'JSON']}
              activeButton={activeButton}
              onClick={this.switchView.bind(this)}
              disabled={!this.props.isExpressibleByRules}
            />
          </StatusRow>
          {view}
        </Grid>
      </div>
    );
  }
}

Validation.propTypes = {
  editState: React.PropTypes.oneOf(['unmodified', 'modified', 'updating', 'error', 'success']).isRequired,
  viewMode: React.PropTypes.oneOf(['Rule Builder', 'JSON']).isRequired,
  isExpressibleByRules: React.PropTypes.bool.isRequired,
  validationAction: React.PropTypes.oneOf(['warn', 'error']).isRequired,
  validatorDoc: React.PropTypes.object.isRequired,
  validationLevel: React.PropTypes.oneOf(['off', 'moderate', 'strict']).isRequired,
  validationRules: React.PropTypes.array.isRequired
};

Validation.defaultProps = {
  editState: 'unmodified',
  viewMode: 'Rule Builder',
  isExpressibleByRules: true,
  validationAction: 'warn',
  validatorDoc: {},
  validationLevel: 'off',
  validationRules: []
};

Validation.displayName = 'Validation';

module.exports = Validation;
