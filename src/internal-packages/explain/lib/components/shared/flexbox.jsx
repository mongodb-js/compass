const React = require('react');
const PropTypes = require('prop-types');
const _ = require('lodash');

class FlexBox extends React.Component {

  /**
   * Render view switcher component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const style = _.omit(this.props, 'children');
    style.display = 'flex';
    return (
      <div style={style}>
        {this.props.children}
      </div>
    );
  }
}

FlexBox.propTypes = {
  children: PropTypes.node,
  flexDirection: PropTypes.oneOf(['row', 'row-reverse', 'column', 'column-reverse']),
  justifyContent: PropTypes.oneOf(['flex-start', 'flex-end', 'center', 'space-between', 'space-around']),
  alignItems: PropTypes.oneOf(['flex-start', 'flex-end', 'center', 'stretch', 'baseline']),
  alignContent: PropTypes.oneOf(['flex-start', 'flex-end', 'center', 'stretch', 'space-between', 'space-around'])
};

FlexBox.defaultProps = {
  flexDirection: 'row',
  justifyContent: 'flex-start',
  alignItems: 'center',
  alignContent: 'center'
};

FlexBox.displayName = 'FlexBox';

module.exports = FlexBox;
