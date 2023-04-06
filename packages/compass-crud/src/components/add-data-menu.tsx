import React from 'react';
import {
  Icon,
  Tooltip,
  DropdownMenuButton,
  css,
} from '@mongodb-js/compass-components';
import type { MenuAction } from '@mongodb-js/compass-components';

const tooltipContainerStyles = css({
  display: 'flex',
  alignItems: 'center',
});

type AddDataMenuProps = {
  instanceDescription: string;
  insertDataHandler: (openInsertKey: AddDataOption) => void;
  isWritable: boolean;
};

function AddDataMenuButton({
  insertDataHandler,
  isDisabled = false,
}: {
  insertDataHandler: (openInsertKey: AddDataOption) => void;
  isDisabled?: boolean;
}) {
  return (
    <DropdownMenuButton<AddDataOption>
      data-testid="crud-add-data"
      actions={addDataActions}
      onAction={insertDataHandler}
      buttonText="Add data"
      buttonProps={{
        size: 'xsmall',
        variant: 'primary',
        leftGlyph: <Icon glyph="PlusWithCircle" />,
        disabled: isDisabled,
      }}
    ></DropdownMenuButton>
  );
}

type AddDataOption = 'import-file' | 'insert-document';
const addDataActions: MenuAction<AddDataOption>[] = [
  { action: 'import-file', label: 'Import JSON or CSV file' },
  { action: 'insert-document', label: 'Insert document' },
];

const AddDataMenu: React.FunctionComponent<AddDataMenuProps> = ({
  instanceDescription,
  insertDataHandler,
  isWritable,
}) => {
  if (isWritable) {
    return <AddDataMenuButton insertDataHandler={insertDataHandler} />;
  }

  // When we're not writable return a disabled button with the instance
  // description as a tooltip.
  return (
    <Tooltip
      trigger={({
        children: tooltipChildren,
        ...tooltipTriggerProps
      }: React.HTMLProps<HTMLInputElement>) => (
        <div className={tooltipContainerStyles} {...tooltipTriggerProps}>
          <AddDataMenuButton
            insertDataHandler={insertDataHandler}
            isDisabled={true}
          />
          {tooltipChildren}
        </div>
      )}
      // Disable the tooltip when the instance is in a writable state.
      isDisabled={isWritable}
      justify="middle"
      delay={500}
    >
      {instanceDescription}
    </Tooltip>
  );
};

export { AddDataMenu };
