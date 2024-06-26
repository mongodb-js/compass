import React, { useCallback, useMemo, useState } from 'react';
import {
  Body,
  css,
  cx,
  Icon,
  IconButton,
  KeylineCard,
  palette,
  spacing,
  useDarkMode,
  SearchInput,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import { toggleSidePanel } from '../../modules/side-panel';
import { STAGE_WIZARD_USE_CASES } from './stage-wizard-use-cases';
import { FeedbackLink } from './feedback-link';
import { addWizard } from '../../modules/pipeline-builder/stage-editor';
import { UseCaseCard } from './stage-wizard-use-cases';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { useConnectionInfoAccess } from '@mongodb-js/compass-connections/provider';

const containerStyles = css({
  height: '100%',

  paddingTop: spacing[1],
  borderBottomRightRadius: 0,
  borderBottomLeftRadius: 0,
  borderBottom: 'none',
  backgroundColor: palette.gray.light3,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
});

const darkModeContainerStyles = css({
  backgroundColor: palette.gray.dark3,
});

const headerStyles = css({
  display: 'flex',
  alignItems: 'center',
});

const closeButtonStyles = css({
  marginLeft: 'auto',
});

const titleStylesDark = css({
  color: palette.green.light2,
});

const titleStylesLight = css({
  color: palette.green.dark2,
});

const headerContainerStyles = css({
  paddingLeft: spacing[2],
  paddingRight: spacing[2],
});

const contentStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
  overflow: 'auto',
  paddingTop: spacing[1],
  paddingLeft: spacing[2],
  paddingRight: spacing[2],
  paddingBottom: spacing[3],
});

type AggregationSidePanelProps = {
  onSelectUseCase: (id: string, stageOperator: string) => void;
  onCloseSidePanel: () => void;
};

export const AggregationSidePanel = ({
  onCloseSidePanel,
  onSelectUseCase,
}: AggregationSidePanelProps) => {
  const track = useTelemetry();
  const connectionInfoAccess = useConnectionInfoAccess();
  const [searchText, setSearchText] = useState<string>('');
  const darkMode = useDarkMode();

  const filteredUseCases = useMemo(() => {
    return STAGE_WIZARD_USE_CASES.filter(({ title, stageOperator }) => {
      return title.includes(searchText) || stageOperator.includes(searchText);
    }).map(({ id, title, stageOperator }) => ({ id, title, stageOperator }));
  }, [searchText]);

  const handleSearchTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(e.target.value);
    },
    [setSearchText]
  );

  const onSelect = useCallback(
    (id: string) => {
      const useCase = STAGE_WIZARD_USE_CASES.find(
        (useCase) => useCase.id === id
      );
      if (!useCase) {
        return;
      }
      onSelectUseCase(id, useCase.stageOperator);
      track(
        'Aggregation Use Case Added',
        {
          drag_and_drop: false,
          stage_name: useCase.stageOperator,
        },
        connectionInfoAccess.getCurrentConnectionInfo()
      );
    },
    [onSelectUseCase, track, connectionInfoAccess]
  );

  return (
    <KeylineCard
      data-testid="aggregation-side-panel"
      className={cx(containerStyles, darkMode && darkModeContainerStyles)}
    >
      <div className={headerContainerStyles}>
        <div className={headerStyles}>
          <Body
            weight="medium"
            className={darkMode ? titleStylesDark : titleStylesLight}
          >
            Stage Wizard
          </Body>
          <IconButton
            className={closeButtonStyles}
            title="Hide Stage Wizard"
            aria-label="Hide Stage Wizard"
            onClick={() => onCloseSidePanel()}
          >
            <Icon glyph="X" />
          </IconButton>
        </div>
        <SearchInput
          value={searchText}
          onChange={handleSearchTextChange}
          placeholder="Search for a Stage"
          aria-label="Search for a Stage"
        />
      </div>

      <div className={contentStyles} data-testid="side-panel-content">
        {filteredUseCases.map((useCase, index) => {
          if (index !== 0) {
            return (
              <UseCaseCard
                {...useCase}
                key={useCase.id}
                onSelect={() => onSelect(useCase.id)}
              />
            );
          }

          return (
            <UseCaseCard
              {...useCase}
              key={useCase.id}
              onSelect={() => onSelect(useCase.id)}
            />
          );
        })}
        <FeedbackLink />
      </div>
    </KeylineCard>
  );
};

export default connect(null, {
  onCloseSidePanel: toggleSidePanel,
  onSelectUseCase: addWizard,
})(AggregationSidePanel);
