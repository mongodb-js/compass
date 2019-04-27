import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ButtonsWaiting from 'components/buttons-waiting';
import ButtonsError from 'components/buttons-error';
import SchemaSteps from 'components/steps';

const DEFAULT_MAX_TIME_MS = 10000;

/**
 * Component for the entire document list.
 */
class SchemaStatusSubview extends React.Component {
  static displayName = 'StatusSubviewComponent';
  static propTypes = {
    store: PropTypes.object.isRequired
  }

  constructor(props) {
    super(props);
    this.state = {
      samplingTimeMS: 0,
      samplingState: 'initial',
      maxTimeMS: DEFAULT_MAX_TIME_MS
    };
  }

  componentWillMount() {
    this.unsubscribe = this.props.store.listen((state) => {
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

export default SchemaStatusSubview;
