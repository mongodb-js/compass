import React, { PureComponent } from 'react';
import { Link, Tooltip, cx } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import type { RootState } from '../../modules';
import { getStageInfo } from '../../utils/stage';

import styles from './stage-preview-toolbar.module.less';

const OperatorLink: React.FunctionComponent<{
  stageOperator: string;
  description?: string;
  link?: string;
}> = ({ stageOperator, description, link }) => {
  return (
    <span>
      <Tooltip
        delay={300}
        isDisabled={!description}
        trigger={({ children, ...props }) => {
          return (
            <Link
              {...props}
              target="_blank"
              className={styles['stage-preview-toolbar-link']}
              href={link}
            >
              {children}
              {stageOperator}
            </Link>
          );
        }}
      >
        {description}
      </Tooltip>
    </span>
  );
};

const DefaultPreviewText: React.FunctionComponent<{
  stageOperator: string;
  previewSize: number;
  description?: string;
  link?: string;
}> = ({ stageOperator, previewSize, description, link }) => {
  return (
    <div>
      <span>
        Output after{' '}
        <OperatorLink
          stageOperator={stageOperator}
          description={description}
          link={link}
        ></OperatorLink>{' '}
        stage
      </span>{' '}
      <span data-testid="stage-preview-toolbar-tooltip">
        (Sample of {previewSize} {previewSize !== 1 ? 'documents' : 'document'})
      </span>
    </div>
  );
};

/**
 * The stage preview toolbar component.
 */
export class StagePreviewToolbar extends PureComponent<{
  stageOperator?: string;
  hasServerError?: boolean;
  isEnabled?: boolean;
  previewSize: number;
  description?: string;
  link?: string;
  destination?: string;
}> {
  render() {
    const {
      stageOperator,
      hasServerError,
      isEnabled,
      previewSize,
      description,
      link,
      destination
    } = this.props;

    return (
      <div
        className={cx(styles['stage-preview-toolbar'], {
          [styles['stage-preview-toolbar-errored']]: hasServerError
        })}
      >
        {isEnabled ? (
          stageOperator ? (
            destination ? (
              `Documents will be saved to ${destination}.`
            ) : (
              <DefaultPreviewText
                stageOperator={stageOperator}
                previewSize={previewSize}
                description={description}
                link={link}
              ></DefaultPreviewText>
            )
          ) : (
            'A sample of the aggregated results from this stage will be shown below.'
          )
        ) : (
          'Stage is disabled. Results not passed in the pipeline.'
        )}
      </div>
    );
  }
}

export default connect((state: RootState, ownProps: { index: number }) => {
  const stage = state.pipelineBuilder.stageEditor.stages[ownProps.index];
  const stageInfo = getStageInfo(
    state.namespace,
    stage.stageOperator,
    stage.value
  );
  return {
    stageOperator: stage.stageOperator,
    hasServerError: !!stage.serverError,
    isEnabled: !stage.disabled,
    previewSize: stage.previewDocs?.length ?? 0,
    ...stageInfo
  };
}, null)(StagePreviewToolbar);
