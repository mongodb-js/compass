import React, { Component } from 'react';
import PropTypes from 'prop-types';
import omit from 'lodash.omit';

/**
 * The FlexBox component.
 */
class FlexBox extends Component {
  static displayName = 'FlexBoxComponent';

  static propTypes = {
    children: PropTypes.node,
    flexDirection: PropTypes.oneOf(['row', 'row-reverse', 'column', 'column-reverse']),
    justifyContent: PropTypes.oneOf(['flex-start', 'flex-end', 'center', 'space-between', 'space-around']),
    alignItems: PropTypes.oneOf(['flex-start', 'flex-end', 'center', 'stretch', 'baseline']),
    alignContent: PropTypes.oneOf(['flex-start', 'flex-end', 'center', 'stretch', 'space-between', 'space-around'])
  }

  static defaultProps = {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    alignContent: 'center'
  };

  /**
   * Renders FlexBox component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const style = omit(this.props, 'children');

    style.display = 'flex';

    return (<div style={style}>{this.props.children}</div>);
  }
}

export default FlexBox;
