const React = require('react');
const createReactClass = require('create-react-class');
const ButtonsWaiting = require('./buttons-waiting');

const StateMixin = require('reflux-state-mixin');
const ButtonsError = require('./buttons-error');

const SchemaStore = require('../../store');
const SchemaSteps = require('./steps');

// const debug = require('debug')('mongodb-compass:schema:status-subview');

/**
 * Component for the entire document list.
 */
const SchemaStatusSubview = createReactClass({

  mixins: [
    StateMixin.connect(SchemaStore)
  ],

  render() {
    return (
      <div id="schema-status-subview">
        <SchemaSteps
          samplingTimeMS={this.state.samplingTimeMS}
          samplingState={this.state.samplingState}
        />
        <ButtonsWaiting
          samplingState={this.state.samplingState}
          samplingTimeMS={this.state.samplingTimeMS}
        />
        <ButtonsError
          maxTimeMS={this.state.maxTimeMS}
          samplingState={this.state.samplingState}
        />
      </div>
    );
  }

});

module.exports = SchemaStatusSubview;
