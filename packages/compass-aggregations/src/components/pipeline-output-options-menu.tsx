import React from 'react';
import {
  css,
  DropdownMenuButton,
  useTranslation,
} from '@mongodb-js/compass-components';
import type { MenuAction } from '@mongodb-js/compass-components';

export type PipelineOutputOption = 'expand' | 'collapse';

const containerStyles = css({
  display: 'flex',
  alignItems: 'center',
  flex: 'none',
});

export const PipelineOutputOptionsMenu: React.FunctionComponent<{
  onChangeOption: (option: PipelineOutputOption) => void;
  buttonText?: string;
}> = ({ onChangeOption, buttonText }) => {
  const t = useTranslation();
  const pipelineOptionsActions: MenuAction<PipelineOutputOption>[] = [
    {
      action: 'collapse',
      label: t('aggregations.outputOptions.collapseAll', 'Collapse all fields'),
    },
    {
      action: 'expand',
      label: t('aggregations.outputOptions.expandAll', 'Expand all fields'),
    },
  ];
  const defaultTitle = t('aggregations.outputOptions.title', 'Output Options');
  return (
    <div className={containerStyles}>
      <DropdownMenuButton<PipelineOutputOption>
        data-testid="pipeline-output-options"
        actions={pipelineOptionsActions}
        onAction={onChangeOption}
        buttonText={buttonText ?? defaultTitle}
        buttonProps={{
          size: 'xsmall',
          title: buttonText || defaultTitle,
          ['aria-label']: buttonText || defaultTitle,
        }}
      ></DropdownMenuButton>
    </div>
  );
};
