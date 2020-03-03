import React from 'react';
import PropTypes from 'prop-types';

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
        <p className={`${BASE}-header`}>{this.props.header}</p>
        <p className={`${BASE}-subheader`}>{this.props.subtext}</p>
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
