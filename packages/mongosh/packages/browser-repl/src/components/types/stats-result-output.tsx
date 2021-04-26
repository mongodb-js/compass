import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ObjectOutput } from './object-output';

interface StatsResultOutputProps {
  value: Record<string, any>;
}

export class StatsResultOutput extends Component<StatsResultOutputProps> {
  static propTypes = {
    value: PropTypes.any
  };

  render(): JSX.Element {
    const result: JSX.Element[] = [];
    for (const [ key, value ] of Object.entries(this.props.value)) {
      if (result.length > 0) {
        result.push(<hr key={`${key}-separator`} />);
      }
      result.push(<div key={key}>
        <h4>{key}</h4>
        <ObjectOutput value={value} />
      </div>);
    }
    return <div>{result}</div>;
  }
}
