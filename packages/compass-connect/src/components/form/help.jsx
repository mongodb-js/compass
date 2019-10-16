import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { HelpItems, AtlasLink } from 'helpers/help-items';

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
    return HelpItems[this.props.viewType].map((item, key) => (
      <div key={key} className={classnames(styles['help-item'])}>
        <p key="pTitle" className={classnames(styles['help-item-question'])}>
          {item.title}
        </p>
        {item.body}
      </div>
    ));
  }

  render() {
    return (
      <div className={classnames(styles['help-container'])}>
        <div className={classnames(styles['help-item-list'])}>
          <div className={classnames(styles['atlas-link-container'])}>
            <div className={classnames(styles['atlas-link'])}>
              <div className={classnames(styles['help-content'])}>
                <p className={classnames(styles['help-item-question'])}>
                  {AtlasLink.title}
                </p>
                {AtlasLink.body}
              </div>
            </div>
          </div>
          {this.renderHelpItems()}
        </div>
      </div>
    );
  }
}

export default Help;
