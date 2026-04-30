import React, { useCallback, useMemo, useState } from 'react';
import {
  Icon,
  Tooltip,
  DropdownMenuButton,
  css,
} from '@mongodb-js/compass-components';
import type { MenuAction } from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model/provider';
import { useLocalAppRegistry } from '@mongodb-js/compass-app-registry';
import {
  ExperimentTestGroups,
  ExperimentTestNames,
  useAssignment,
  useFireExperimentViewed,
} from '@mongodb-js/compass-telemetry/provider';
import { DOCUMENT_NARROW_ICON_BREAKPOINT } from '../constants/document-narrow-icon-breakpoint';

const tooltipContainerStyles = css({
  display: 'flex',
  alignItems: 'center',
});

const addDataMenuButtonStyles = css({
  whiteSpace: 'nowrap',
});

// `display: contents` makes the wrapper transparent for layout so the
// trigger button continues to lay out as a direct flex child of the
// surrounding toolbar.
const addDataMenuWrapperStyles = css({
  display: 'contents',
});

type AddDataMenuProps = {
  instanceDescription: string;
  insertDataHandler: (openInsertKey: 'import-file' | 'insert-document') => void;
  isWritable: boolean;
  isMockDataGeneratorEnabled?: boolean;
};

function AddDataMenuButton({
  insertDataHandler,
  isDisabled = false,
  isMockDataGeneratorEnabled = false,
}: {
  insertDataHandler: (openInsertKey: 'import-file' | 'insert-document') => void;
  isDisabled?: boolean;
  isMockDataGeneratorEnabled?: boolean;
}) {
  const isImportExportEnabled = usePreference('enableImportExport');
  const localAppRegistry = useLocalAppRegistry();

  const mockDataGeneratorAssignment = useAssignment(
    ExperimentTestNames.mockDataGenerator,
    false // "Experiment Viewed" is fired below on menu open
  );
  const mockDataGeneratorVariant =
    mockDataGeneratorAssignment?.assignment?.assignmentData?.variant;
  const isInMockDataTreatmentVariant =
    mockDataGeneratorVariant === ExperimentTestGroups.mockDataGeneratorVariant;

  const [hasOpenedMenu, setHasOpenedMenu] = useState(false);

  // Fire exposure only when the user has opened the menu, the feature is
  // enabled for them, and they're in the experiment.
  useFireExperimentViewed({
    testName: ExperimentTestNames.mockDataGenerator,
    shouldFire:
      hasOpenedMenu && isMockDataGeneratorEnabled && !!mockDataGeneratorVariant,
  });

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

    // The menu item only renders for users in treatment variant group
    if (isMockDataGeneratorEnabled && isInMockDataTreatmentVariant) {
      actions.push({
        action: 'generate-mock-data' as const,
        label: 'Generate Mock Data Script',
      });
    }

    return actions;
  }, [
    isImportExportEnabled,
    isMockDataGeneratorEnabled,
    isInMockDataTreatmentVariant,
  ]);

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

  // Detect the user opening the menu from the capture phase, before the
  // trigger button calls evt.stopPropagation() in its bubble-phase handler.
  // The menu items render in a portal so their clicks don't bubble through
  // here; this only fires for clicks on the trigger button itself.
  const handleClickCapture = useCallback(() => {
    setHasOpenedMenu(true);
  }, []);

  return (
    <span
      onClickCapture={handleClickCapture}
      className={addDataMenuWrapperStyles}
    >
      <DropdownMenuButton<AddDataOption>
        data-testid="crud-add-data"
        actions={addDataActions}
        onAction={handleAction}
        buttonText="Add data"
        buttonProps={{
          size: 'xsmall',
          variant: 'primary',
          leftGlyph: <Icon glyph="PlusWithCircle" />,
          disabled: isDisabled,
          className: addDataMenuButtonStyles,
        }}
        narrowBreakpoint={DOCUMENT_NARROW_ICON_BREAKPOINT}
      ></DropdownMenuButton>
    </span>
  );
}

type AddDataOption = 'import-file' | 'insert-document' | 'generate-mock-data';

const AddDataMenu: React.FunctionComponent<AddDataMenuProps> = ({
  instanceDescription,
  insertDataHandler,
  isWritable,
  isMockDataGeneratorEnabled,
}) => {
  if (isWritable) {
    return (
      <AddDataMenuButton
        insertDataHandler={insertDataHandler}
        isMockDataGeneratorEnabled={isMockDataGeneratorEnabled}
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
            isMockDataGeneratorEnabled={isMockDataGeneratorEnabled}
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
