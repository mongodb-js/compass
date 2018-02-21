import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';

const propTypes = {
  onClick: PropTypes.func.isRequired
};

const CancelButton = (props) => (<i { ...props } className={ cn('fa', 'fa-times') } />);

CancelButton.propTypes = propTypes;

export default CancelButton;
