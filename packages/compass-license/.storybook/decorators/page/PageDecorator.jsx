import React from 'react';
import classnames from 'classnames';
import styles from './PageDecorator.less';

const PageDecorator = (storyFn) => (
  <article className={classnames(styles.article)}>
    { storyFn() }
  </article>
);

export default PageDecorator;
export { PageDecorator };
