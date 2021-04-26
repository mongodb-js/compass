import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import styles from './card.less';

const CardBody = ({children, className, ...other}) => {
  const _className = classnames(styles['component-body'], className);

  return (
    <div className={_className} {...other}>
      {children}
    </div>
  );
};

CardBody.propTypes = {
  children: PropTypes.any,
  className: PropTypes.string
};

CardBody.defaultProps = {
  className: ''
};

export default CardBody;
export { CardBody };
