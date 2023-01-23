import React from 'react';
import { connect } from 'react-redux';

import { Body, Link, Tooltip, css, cx, useDarkMode, palette, spacing, IconButton, Icon } from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model';
import type { RootState } from '../../modules';
import { getStageInfo } from '../../utils/stage';
import { hasSyntaxError } from '../../utils/stage';
import { enableFocusMode } from '../../modules/focus-mode';

const toolbarStyles = css({
  width: '100%',

  height: spacing[5] + spacing[1],
  paddingLeft: spacing[2],
  paddingRight: spacing[2],

  display: 'flex',
  alignItems: 'center',
  borderBottomWidth: '1px',
  borderBottomStyle: 'solid',
});

const collapsedToolbarStyles = css({
  borderBottomWidth: 0,
});

const toolbarStylesDark = css({
  borderBottomColor: palette.gray.dark2
});

const toolbarStylesLight = css({
  borderBottomColor: palette.gray.light2
});

const toolbarWarningStyles = css({
  borderBottomColor: palette.yellow.base
});

const toolbarErrorStyles = css({
  borderBottomColor: palette.red.base
});

const toolbarTextStyles = css({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const focusModeButtonStyles = css({
  marginLeft: 'auto',
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
              data-testid="stage-preview-toolbar-link"
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
  index: number;
  stageOperator?: string | null;
  hasSyntaxError?: boolean;
  hasServerError?: boolean;
  isEnabled?: boolean;
  previewSize?: number;
  description?: string;
  link?: string;
  destination?: string;
  isCollapsed?: boolean;
  onFocusMode: (stageIndex: number) => void;
};

function StagePreviewToolbar({
  stageOperator,
  hasSyntaxError,
  hasServerError,
  isEnabled,
  previewSize,
  description,
  link,
  destination,
  isCollapsed,
  onFocusMode,
  index: stageIndex
}: StagePreviewToolbarProps) {
  const darkMode = useDarkMode();
  const showFocusMode = usePreference('showFocusMode', React);
  return (
    <div className={cx(
      toolbarStyles,
      darkMode ? toolbarStylesDark : toolbarStylesLight,
      hasSyntaxError && toolbarWarningStyles,
      hasServerError && toolbarErrorStyles,
      isCollapsed && collapsedToolbarStyles,
    )}>
      <Body
        className={toolbarTextStyles}
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
      {showFocusMode && <IconButton className={focusModeButtonStyles} onClick={() => onFocusMode(stageIndex)} aria-label={'Focus Mode'}>
        <Icon glyph={'FullScreenEnter'} size="small"></Icon>
      </IconButton>}
    </div>
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
    index: ownProps.index,
    stageOperator: stage.stageOperator,
    hasSyntaxError: hasSyntaxError(stage),
    hasServerError: !!stage.serverError,
    isEnabled: !stage.disabled,
    previewSize: stage.previewDocs?.length ?? 0,
    isCollapsed: stage.collapsed,
    ...stageInfo
  };
}, {
  onFocusMode: enableFocusMode
})(StagePreviewToolbar);
