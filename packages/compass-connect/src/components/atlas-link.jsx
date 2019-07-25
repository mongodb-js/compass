import React from 'react';
import Actions from 'actions';
import classnames from 'classnames';

import styles from './connect.less';

class AtlasLink extends React.Component {
  static displayName = 'AtlasLink';

  /**
   * Visits create atlas cluster page'.
   */
  onLinkClicked() {
    Actions.onVisitAtlasLink();
  }

  /**
   * Visits Atlas page.
   */
  onLearnLinkClicked() {
    Actions.onAtlasLearnMore();
  }

  render() {
    return (
      <div className={classnames(styles['connect-atlas'])}>
        <div
          className={classnames(styles['connect-atlas-link'])}
          onClick={this.onLinkClicked.bind(this)}>
          <i className="fa fa-fw fa-external-link" />
          Create free Atlas cluster
        </div>
        <div>
          <div className={classnames(styles['connect-atlas-includes'])}>
            Includes 512 MB of data storage.
          </div>
          <div
            className={classnames(styles['connect-atlas-learn-more'])}
            onClick={this.onLearnLinkClicked.bind(this)}>
            Learn more
          </div>
        </div>
      </div>
    );
  }
}

export default AtlasLink;
