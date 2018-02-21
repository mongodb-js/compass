import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
  progress: PropTypes.number,
  complete: PropTypes.bool,
  canceled: PropTypes.bool
};

const ProgressBar = ({ progress, complete, canceled }) => (
  <span>
    { (complete || canceled) ? <span>{ complete ? 'Complete' : 'Canceled' }</span> : null }
    { !(complete || canceled) && progress ? progress + '%' : null }
  </span>
);

ProgressBar.propTypes = propTypes;

export default ProgressBar;
