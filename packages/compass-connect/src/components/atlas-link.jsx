import React from 'react';
import Actions from 'actions';
import classnames from 'classnames';

import styles from './connect.less';

/**
 * The link to the create Atlas cluster from Compass page.
 */
const ATLAS_CREATE_CLUSTER_LINK = 'https://www.mongodb.com/cloud/atlas/lp/general?jmp=compass';

/**
 * The link to the create Atlas cluster with more general info page.
 */
const ATLAS_LEARN_MORE_LINK = 'https://www.mongodb.com/cloud/atlas';

class AtlasLink extends React.Component {
  static displayName = 'AtlasLink';

  /**
   * Visits the create Atlas cluster from Compass page.
   */
  onCreateClusterClicked() {
    Actions.onExternalLinkClicked(
      ATLAS_CREATE_CLUSTER_LINK,
      'create-atlas-cluster-clicked'
    );
  }

  /**
   * Visits the create Atlas cluster with more general info page.
   */
  onLearnMoreClicked() {
    Actions.onExternalLinkClicked(
      ATLAS_LEARN_MORE_LINK,
      'create-atlas-cluster-learn-more-clicked'
    );
  }

  render() {
    return (
      <div className={classnames(styles['connect-atlas'])}>
        <div
          className={classnames(styles['connect-atlas-link'])}
          onClick={this.onCreateClusterClicked.bind(this)}>
          <i className="fa fa-fw fa-external-link" />
          Create Free Atlas Cluster
        </div>
        <div>
          <div className={classnames(styles['connect-atlas-includes'])}>
            Includes 512 MB of data storage.
          </div>
          <div
            className={classnames(styles['connect-atlas-learn-more'])}
            onClick={this.onLearnMoreClicked.bind(this)}>
            Learn more
          </div>
        </div>
      </div>
    );
  }
}

export default AtlasLink;
