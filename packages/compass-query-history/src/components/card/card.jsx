import React, { PropTypes } from 'react';
import classnames from 'classnames';
import styles from './card.less';

const Card = ({children, className, ...other}) => {
  const _className = classnames(styles.component, className);

  return (
    <div className={_className} {...other}>
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.any,
  className: PropTypes.string
};

Card.defaultProps = {
  className: ''
};

export default Card;
export { Card };
