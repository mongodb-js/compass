import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import styles from './ComponentPreview.less';

const ComponentPreview = ({ dark, className, children }) => {
  const _className = classnames(
    styles.root,
    { [styles['root--light']]: !dark },
    { [styles['root--dark']]: dark },
    className
  );

  return (
    <div className={_className}>
      {children}
    </div>
  );
};

ComponentPreview.defaultProps = {
  dark: false,
  className: ''
};

ComponentPreview.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  dark: PropTypes.bool
};

export default ComponentPreview;
export { ComponentPreview };
