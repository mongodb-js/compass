import React, { useCallback, useMemo } from 'react';
import {
  Icon,
  Tooltip,
  DropdownMenuButton,
  css,
  useTranslation,
} from '@mongodb-js/compass-components';
import type { MenuAction } from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model/provider';
import { useLocalAppRegistry } from '@mongodb-js/compass-app-registry';
import { DOCUMENT_NARROW_ICON_BREAKPOINT } from '../constants/document-narrow-icon-breakpoint';

const tooltipContainerStyles = css({
  display: 'flex',
  alignItems: 'center',
});

const addDataMenuButtonStyles = css({
  whiteSpace: 'nowrap',
});

type AddDataMenuProps = {
  instanceDescription: string;
  insertDataHandler: (openInsertKey: 'import-file' | 'insert-document') => void;
  isWritable: boolean;
  isMockDataGeneratorEligible?: boolean;
};

function AddDataMenuButton({
  insertDataHandler,
  isDisabled = false,
  isMockDataGeneratorEligible = false,
}: {
  insertDataHandler: (openInsertKey: 'import-file' | 'insert-document') => void;
  isDisabled?: boolean;
  isMockDataGeneratorEligible?: boolean;
}) {
  const t = useTranslation();
  const isImportExportEnabled = usePreference('enableImportExport');
  const localAppRegistry = useLocalAppRegistry();

  const addDataActions = useMemo(() => {
    const actions: MenuAction<AddDataOption>[] = [
      {
        action: 'insert-document' as const,
        label: t('crud.addData.insertDocument', 'Insert document'),
      },
    ];

    if (isImportExportEnabled) {
      actions.unshift({
        action: 'import-file' as const,
        label: t('crud.addData.importFile', 'Import JSON or CSV file'),
      });
    }

    if (isMockDataGeneratorEligible) {
      actions.push({
        action: 'generate-mock-data' as const,
        label: t('crud.addData.generateMockData', 'Generate mock data script'),
      });
    }

    return actions;
  }, [isImportExportEnabled, isMockDataGeneratorEligible, t]);

  const handleAction = useCallback(
    (action: AddDataOption) => {
      if (action === 'generate-mock-data') {
        localAppRegistry.emit('open-mock-data-generator-modal');
      } else {
        insertDataHandler(action);
      }
    },
    [localAppRegistry, insertDataHandler]
  );

  return (
    <DropdownMenuButton<AddDataOption>
      data-testid="crud-add-data"
      actions={addDataActions}
      onAction={handleAction}
      buttonText={t('crud.addData.button', 'Add data')}
      buttonProps={{
        size: 'xsmall',
        variant: 'primary',
        leftGlyph: <Icon glyph="PlusWithCircle" />,
        disabled: isDisabled,
        className: addDataMenuButtonStyles,
      }}
      narrowBreakpoint={DOCUMENT_NARROW_ICON_BREAKPOINT}
    ></DropdownMenuButton>
  );
}

type AddDataOption = 'import-file' | 'insert-document' | 'generate-mock-data';

const AddDataMenu: React.FunctionComponent<AddDataMenuProps> = ({
  instanceDescription,
  insertDataHandler,
  isWritable,
  isMockDataGeneratorEligible,
}) => {
  if (isWritable) {
    return (
      <AddDataMenuButton
        insertDataHandler={insertDataHandler}
        isMockDataGeneratorEligible={isMockDataGeneratorEligible}
      />
    );
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
            isMockDataGeneratorEligible={isMockDataGeneratorEligible}
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
