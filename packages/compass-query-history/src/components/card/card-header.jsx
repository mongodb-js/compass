import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import styles from './card.less';

const CardHeader = ({children, title, className, actionsVisible, ...other}) => {
  const _className = classnames(
    styles['component-header'],
    className
  );

  const _headerInnerClassName = classnames(
    styles['component-header-inner']
  );

  const _titleClassName = classnames(
    styles['component-header-title']
  );

  const _actionsClassName = classnames(
    styles['component-header-actions'],
    { [ styles['is-visible'] ]: actionsVisible }
  );

  const renderTitle = (titleChild) => {
    return React.Children.map(titleChild, (child) => {
      // If the title is a text node, wrap it in the title element
      // else return the node as is
      return (child.type === undefined)
        ? <div className={_titleClassName}>{child}</div>
        : <div className={_headerInnerClassName}>{child}</div>;
    });
  };

  return (
    <div className={_className} {...other}>
      { title ? renderTitle(title) : null }
      { children ? <div className={_actionsClassName}>{children}</div> : null }
    </div>
  );
};

CardHeader.propTypes = {
  children: PropTypes.any,
  className: PropTypes.string,
  title: PropTypes.any,
  actionsVisible: PropTypes.bool
};

CardHeader.defaultProps = {
  className: '',
  title: null,
  actionsVisible: false
};

export default CardHeader;
export { CardHeader };
