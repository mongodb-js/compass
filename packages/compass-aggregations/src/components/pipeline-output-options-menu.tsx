import React from 'react';
import { css, DropdownMenuButton } from '@mongodb-js/compass-components';
import type { MenuAction } from '@mongodb-js/compass-components';

export type PipelineOutputOption = 'expand' | 'collapse';
const pipelineOptionsActions: MenuAction<PipelineOutputOption>[] = [
  { action: 'collapse', label: 'Collapse all fields' },
  { action: 'expand', label: 'Expand all fields' },
];

const containerStyles = css({
  display: 'flex',
  alignItems: 'center',
  flex: 'none',
});

export const PipelineOutputOptionsMenu: React.FunctionComponent<{
  onChangeOption: (option: PipelineOutputOption) => void;
  buttonText?: string;
}> = ({ onChangeOption, buttonText }) => {
  return (
    <div className={containerStyles}>
      <DropdownMenuButton<PipelineOutputOption>
        data-testid="pipeline-output-options"
        actions={pipelineOptionsActions}
        onAction={onChangeOption}
        buttonText={buttonText ?? 'Output Options'}
        buttonProps={{
          size: 'xsmall',
          title: buttonText ?? 'Output Options',
          ['aria-label']: buttonText ?? 'Output Options',
        }}
      ></DropdownMenuButton>
    </div>
  );
};
