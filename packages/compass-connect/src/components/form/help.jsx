import React from 'react';
import Actions from 'actions';
import classnames from 'classnames';

import styles from '../connect.less';

class Help extends React.Component {
  static displayName = 'Help';

  /**
   * Visits Atlas page.
   *
   * @param {Object} evt - evt.
   */
  onSignUpClicked(evt) {
    evt.preventDefault();
    Actions.onAtlasLearnMore();
  }

  render() {
    return (
      <div className={classnames(styles['help-container'])}>
        <div className={classnames(styles['help-item-list'])}>
          <div className={classnames(styles['help-item'])}>
            <div className={classnames(styles['help-bullet'])}>&#8226;</div>
            <div className={classnames(styles['help-content'])}>
              <p className={classnames(styles['help-item-question'])}>
                What do I need in order to connect?
              </p>
              <p>
                If you don't have a running cluster, you can <a
                  onClick={this.onSignUpClicked.bind(this)}>
                  sign up a free cluster using MongoDB Atlas
                </a>.
              </p>
            </div>
          </div>
          <div className={classnames(styles['help-item'])}>
            <div className={classnames(styles['help-bullet'])}>&#8226;</div>
            <div className={classnames(styles['help-content'])}>
              <p className={classnames(styles['help-item-question'])}>How do I find my username and password?</p>
              <p>If your mongod instance has authentication set up, you'll need the credentials of the MongoDB user that is configured on the project.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Help;
