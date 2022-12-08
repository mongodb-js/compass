import React from 'react';
import { connect } from 'react-redux';

import { Body, Link, Tooltip, css, cx, useDarkMode, palette, spacing } from '@mongodb-js/compass-components';

import type { RootState } from '../../modules';
import { getStageInfo } from '../../utils/stage';

const toolbarStyles = css({
  width: '100%',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',

  height: spacing[5] + spacing[1],
  paddingLeft: spacing[4],

  display: 'flex',
  alignItems: 'center',
  borderBottomWidth: '1px',
  borderBottomStyle: 'solid',
});


const toolbarStylesDark = css({
  borderBottomColor: palette.gray.dark2
});

const toolbarStylesLight = css({
  borderBottomColor: palette.gray.light2
});

const toolbarErrorStylesDark = css({
  backgroundColor: palette.red.dark3
});

const toolbarErrorStylesLight = css({
  backgroundColor: palette.red.light3
});

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
  previewSize?: number;
  description?: string;
  link?: string;
}> = ({ stageOperator, previewSize, description, link }) => {
  return (
    <Body>
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
    </Body>
  );
};

type StagePreviewToolbarProps = {
  stageOperator?: string;
  hasServerError?: boolean;
  isEnabled?: boolean;
  previewSize?: number;
  description?: string;
  link?: string;
  destination?: string;
};

function StagePreviewToolbar({
  stageOperator,
  hasServerError,
  isEnabled,
  previewSize,
  description,
  link,
  destination
}: StagePreviewToolbarProps) {
  const darkMode = useDarkMode();

  return (
    <Body
      className={cx(
        toolbarStyles,
        darkMode ? toolbarStylesDark : toolbarStylesLight,
        hasServerError && (darkMode ? toolbarErrorStylesDark : toolbarErrorStylesLight)
      )}
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
    </Body>
  );
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
