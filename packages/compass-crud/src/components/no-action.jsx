import React from 'react';
import PropTypes from 'prop-types';

/**
 * General element action component.
 *
 * @param {Object} props - The props.
 *
 * @returns {React.Component} The component.
 */
const NoAction = (props) => {
  return (<div className={props.className}></div>);
};

NoAction.displayName = 'NoAction';

NoAction.propTypes = {
  className: PropTypes.string.isRequired
};

export default NoAction;
