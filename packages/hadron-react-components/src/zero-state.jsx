import React from 'react';
import PropTypes from 'prop-types';
import { H3, Subtitle } from '@mongodb-js/compass-components';

/**
 * Base component CSS class.
 */
const BASE = 'zero-state';

/**
 * Component for a basic zero state.
 */
class ZeroState extends React.Component {
  /**
   * Render the zero state.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={`${BASE}`}>
        <H3 className={`${BASE}-header`}>{this.props.header}</H3>
        <Subtitle className={`${BASE}-subheader`}>{this.props.subtext}</Subtitle>
        <div className={`${BASE}-body`}>
          {this.props.children}
        </div>
      </div>
    );
  }
}

ZeroState.displayName = 'ZeroState';

ZeroState.propTypes = {
  header: PropTypes.string.isRequired,
  subtext: PropTypes.string.isRequired,
  children: PropTypes.node
};

export default ZeroState;
