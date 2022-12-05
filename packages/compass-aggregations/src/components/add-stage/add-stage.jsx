import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { Button, Icon, css, spacing } from '@mongodb-js/compass-components';

import { addStage } from '../../modules/pipeline-builder/stage-editor';


const containerStyles = css({
  textAlign: 'center',
  marginTop: spacing[2],
  marginBottom: spacing[3]
});

export class AddStage extends PureComponent {
  static displayName = 'AddStageComponent';

  static propTypes = {
    onAddStageClick: PropTypes.func.isRequired
  };

  onClick = () => {
    this.props.onAddStageClick();
  };

  /**
   * Render the stage component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div className={containerStyles}>
        <Button data-testid="add-stage" onClick={this.onClick} variant="primary" leftGlyph={<Icon glyph="Plus"></Icon>}>
          Add Stage
        </Button>
      </div>
    );
  }
}

export default connect(null, { onAddStageClick: addStage })(AddStage);
