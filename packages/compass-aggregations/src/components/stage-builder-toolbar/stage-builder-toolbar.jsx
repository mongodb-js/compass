import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { InfoSprinkle } from 'hadron-react-components';
import DeleteStage from './delete-stage';
import AddAfterStage from './add-after-stage';
import ToggleStage from './toggle-stage';
import StageGrabber from './stage-grabber';
import StageCollapser from './stage-collapser';
import StageOperatorSelect from './stage-operator-select';

import styles from './stage-builder-toolbar.less';

/**
 * Map stage operators to doc URLS.
 */
const SPRINKLE_MAPPINGS = {
  '$addFields': 'https://docs.mongodb.com/manual/reference/operator/aggregation/addFields/#pipe._S_addFields',
  '$bucket': 'https://docs.mongodb.com/manual/reference/operator/aggregation/bucket/#pipe._S_bucket',
  '$bucketAuto': 'https://docs.mongodb.com/manual/reference/operator/aggregation/bucketAuto/#pipe._S_bucketAuto',
  '$collStats': 'https://docs.mongodb.com/manual/reference/operator/aggregation/collStats/#pipe._S_collStats',
  '$count': 'https://docs.mongodb.com/manual/reference/operator/aggregation/count/#pipe._S_count',
  '$currentOp': 'https://docs.mongodb.com/manual/reference/operator/aggregation/currentOp/#pipe._S_currentOp',
  '$facet': 'https://docs.mongodb.com/manual/reference/operator/aggregation/facet/#pipe._S_facet',
  '$geoNear': 'https://docs.mongodb.com/manual/reference/operator/aggregation/geoNear/#pipe._S_geoNear',
  '$graphLookup': 'https://docs.mongodb.com/manual/reference/operator/aggregation/graphLookup/#pipe._S_graphLookup',
  '$group': 'https://docs.mongodb.com/manual/reference/operator/aggregation/group/#pipe._S_group',
  '$indexStats': 'https://docs.mongodb.com/manual/reference/operator/aggregation/indexStats/#pipe._S_indexStats',
  '$limit': 'https://docs.mongodb.com/manual/reference/operator/aggregation/limit/#pipe._S_limit',
  '$listLocalSessions': 'https://docs.mongodb.com/manual/reference/operator/aggregation/listLocalSessions/#pipe._S_listLocalSessions',
  '$listSessions': 'https://docs.mongodb.com/manual/reference/operator/aggregation/listSessions/#pipe._S_listSessions',
  '$lookup': 'https://docs.mongodb.com/manual/reference/operator/aggregation/lookup/#pipe._S_lookup',
  '$match': 'https://docs.mongodb.com/manual/reference/operator/aggregation/match/#pipe._S_match',
  '$out': 'https://docs.mongodb.com/manual/reference/operator/aggregation/out/#pipe._S_out',
  '$project': 'https://docs.mongodb.com/manual/reference/operator/aggregation/project/#pipe._S_project',
  '$redact': 'https://docs.mongodb.com/manual/reference/operator/aggregation/redact/#pipe._S_redact',
  '$replaceRoot': 'https://docs.mongodb.com/manual/reference/operator/aggregation/replaceRoot/#pipe._S_replaceRoot',
  '$sample': 'https://docs.mongodb.com/manual/reference/operator/aggregation/sample/#pipe._S_sample',
  '$skip': 'https://docs.mongodb.com/manual/reference/operator/aggregation/skip/#pipe._S_skip',
  '$sort': 'https://docs.mongodb.com/manual/reference/operator/aggregation/sort/#pipe._S_sort',
  '$sortByCount': 'https://docs.mongodb.com/manual/reference/operator/aggregation/sortByCount/#pipe._S_sortByCount',
  '$unwind': 'https://docs.mongodb.com/manual/reference/operator/aggregation/unwind/#pipe._S_unwind'
};

/**
 * The stage builder toolbar component.
 */
class StageBuilderToolbar extends PureComponent {
  static displayName = 'StageBuilderToolbar';
  static propTypes = {
    isExpanded: PropTypes.bool.isRequired,
    isEnabled: PropTypes.bool.isRequired,
    stageOperator: PropTypes.string,
    index: PropTypes.number.isRequired,
    serverVersion: PropTypes.string.isRequired,
    stageOperatorSelected: PropTypes.func.isRequired,
    stageCollapseToggled: PropTypes.func.isRequired,
    stageToggled: PropTypes.func.isRequired,
    stageAddedAfter: PropTypes.func.isRequired,
    stageDeleted: PropTypes.func.isRequired,
    setIsModified: PropTypes.func.isRequired,
    isCommenting: PropTypes.bool.isRequired,
    openLink: PropTypes.func.isRequired,
    runStage: PropTypes.func.isRequired
  }

  /**
   * Render the info sprinkle.
   *
   * @returns {Component} The component.
   */
  renderInfoSprinkle() {
    if (this.props.stageOperator) {
      return (
        <InfoSprinkle
          onClickHandler={this.props.openLink}
          helpLink={SPRINKLE_MAPPINGS[this.props.stageOperator]} />
      );
    }
  }

  /**
   * Renders the stage builder toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['stage-builder-toolbar'])}>
        <StageGrabber />
        <StageCollapser
          isExpanded={this.props.isExpanded}
          index={this.props.index}
          setIsModified={this.props.setIsModified}
          stageCollapseToggled={this.props.stageCollapseToggled} />
        <StageOperatorSelect
          stageOperator={this.props.stageOperator}
          index={this.props.index}
          isEnabled={this.props.isEnabled}
          isCommenting={this.props.isCommenting}
          stageOperatorSelected={this.props.stageOperatorSelected}
          setIsModified={this.props.setIsModified}
          serverVersion={this.props.serverVersion} />
        <ToggleStage
          index={this.props.index}
          isEnabled={this.props.isEnabled}
          runStage={this.props.runStage}
          setIsModified={this.props.setIsModified}
          stageToggled={this.props.stageToggled} />
        {this.renderInfoSprinkle()}
        <div className={classnames(styles['stage-builder-toolbar-right'])}>
          <DeleteStage
            index={this.props.index}
            setIsModified={this.props.setIsModified}
            stageDeleted={this.props.stageDeleted} />
          <AddAfterStage
            index={this.props.index}
            stageAddedAfter={this.props.stageAddedAfter} />
        </div>
      </div>
    );
  }
}

export default StageBuilderToolbar;
