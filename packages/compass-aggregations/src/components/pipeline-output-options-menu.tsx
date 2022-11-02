import React from 'react';
import { DropdownMenuButton } from '@mongodb-js/compass-components';
import type { MenuAction } from '@mongodb-js/compass-components';

export type PipelineOutputOption = 'expand' | 'collapse';
const pipelineOptionsActions: MenuAction<PipelineOutputOption>[] = [
  { action: 'collapse', label: 'Collapse' },
  { action: 'expand', label: 'Expand' },
];

export const PipelineOutputOptionsMenu: React.FunctionComponent<{
  option: PipelineOutputOption;
  onChangeOption: (option: PipelineOutputOption) => void;
}> = ({ option, onChangeOption }) => {
  return (
    <DropdownMenuButton<PipelineOutputOption>
      activeAction={option}
      data-testid="pipeline-output-options"
      actions={pipelineOptionsActions}
      onAction={onChangeOption}
      buttonText="Output Options"
      buttonProps={{
        size: 'xsmall',
      }}
    ></DropdownMenuButton>
  );
};
