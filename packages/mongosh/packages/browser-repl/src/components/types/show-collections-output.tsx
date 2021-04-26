import React, { Component } from 'react';
import PropTypes from 'prop-types';

interface ShowCollectionsOutputProps {
  value: string[];
}

export class ShowCollectionsOutput extends Component<ShowCollectionsOutputProps> {
  static propTypes = {
    value: PropTypes.array
  };

  render(): JSX.Element {
    return <pre>{this.props.value.join('\n')}</pre>;
  }
}
