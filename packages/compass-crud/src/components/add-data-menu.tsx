import React, { useMemo } from 'react';
import {
  Icon,
  Tooltip,
  DropdownMenuButton,
  css,
} from '@mongodb-js/compass-components';
import type { MenuAction } from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model/provider';
import { DOCUMENT_NARROW_ICON_BREAKPOINT } from '../constants/document-narrow-icon-breakpoint';

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
  const isImportExportEnabled = usePreference('enableImportExport');

  const addDataActions = useMemo(() => {
    const actions: MenuAction<AddDataOption>[] = [
      { action: 'insert-document' as const, label: 'Insert document' },
    ];

    if (isImportExportEnabled) {
      actions.unshift({
        action: 'import-file' as const,
        label: 'Import JSON or CSV file',
      });
    }

    return actions;
  }, [isImportExportEnabled]);

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
      narrowBreakpoint={DOCUMENT_NARROW_ICON_BREAKPOINT}
    ></DropdownMenuButton>
  );
}

type AddDataOption = 'import-file' | 'insert-document';

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
      enabled={!isWritable}
      justify="middle"
    >
      {instanceDescription}
    </Tooltip>
  );
};

export { AddDataMenu };
