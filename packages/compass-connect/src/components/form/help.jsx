import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import helpItems from 'helpers/help-items';

import styles from '../connect.less';

class Help extends React.Component {
  static displayName = 'Help';

  static propTypes = { viewType: PropTypes.string };

  /**
   * Renders help items.
   *
   * @returns {React.Component}
   */
  renderHelpItems() {
    return helpItems[this.props.viewType].map((item, key) => (
      <div key={key} className={classnames(styles['help-item'])}>
        <div className={classnames(styles['help-bullet'])}>&#8226;</div>
        <div className={classnames(styles['help-content'])}>
          <p key="pTitle" className={classnames(styles['help-item-question'])}>
            {item.title}
          </p>
          {item.body}
        </div>
      </div>
    ));
  }

  render() {
    return (
      <div className={classnames(styles['help-container'])}>
        <div className={classnames(styles['help-item-list'])}>
          {this.renderHelpItems()}
        </div>
      </div>
    );
  }
}

export default Help;
