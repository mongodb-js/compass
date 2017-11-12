const React = require('react');
const PropTypes = require('prop-types');

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
    return React.createElement(
      'div',
      { className: `${BASE}` },
      React.createElement(
        'p',
        { className: `${BASE}-header` },
        this.props.header
      ),
      React.createElement(
        'p',
        { className: `${BASE}-subheader` },
        this.props.subtext
      ),
      React.createElement(
        'div',
        { className: `${BASE}-body` },
        this.props.children
      )
    );
  }
}

ZeroState.displayName = 'ZeroState';

ZeroState.propTypes = {
  header: PropTypes.string.isRequired,
  subtext: PropTypes.string.isRequired,
  children: PropTypes.node
};

module.exports = ZeroState;