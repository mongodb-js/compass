import React from 'react';
import classnames from 'classnames';
import styles from './page.less';

const Page = storyFn => (
  <article className={classnames(styles.article)}>{storyFn()}</article>
);

export default Page;
export { Page };
