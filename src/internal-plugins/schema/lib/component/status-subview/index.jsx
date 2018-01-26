const React = require('react');
const ButtonsWaiting = require('./buttons-waiting');
const ButtonsError = require('./buttons-error');
const SchemaStore = require('../../store');
const SchemaSteps = require('./steps');

const DEFAULT_MAX_TIME_MS = 10000;

/**
 * Component for the entire document list.
 */
class SchemaStatusSubview extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      samplingTimeMS: 0,
      samplingState: 'initial',
      maxTimeMS: DEFAULT_MAX_TIME_MS
    };
  }

  componentWillMount() {
    this.unsubscribe = SchemaStore.listen((state) => {
      this.setState(state);
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    return (
      <div id="schema-status-subview">
        <SchemaSteps
          samplingTimeMS={this.state.samplingTimeMS}
          samplingState={this.state.samplingState} />
        <ButtonsWaiting
          samplingState={this.state.samplingState}
          samplingTimeMS={this.state.samplingTimeMS} />
        <ButtonsError
          maxTimeMS={this.state.maxTimeMS}
          samplingState={this.state.samplingState} />
      </div>
    );
  }
}

SchemaStatusSubview.displayName = 'SchemaStatusSubview';

module.exports = SchemaStatusSubview;
