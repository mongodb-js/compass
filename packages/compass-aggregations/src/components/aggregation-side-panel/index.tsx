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
  GuideCue,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { useDndMonitor } from '@dnd-kit/core';

import { toggleSidePanel } from '../../modules/side-panel';
import { STAGE_WIZARD_USE_CASES } from './stage-wizard-use-cases';
import { FeedbackLink } from './feedback-link';
import { addWizard } from '../../modules/pipeline-builder/stage-editor';
import { UseCaseCard } from './stage-wizard-use-cases';
import { useGuideCue, GuideCueStorageKeys } from '../use-guide-cue';

const { track } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

const containerStyles = css({
  height: '100%',
  paddingLeft: spacing[2],
  paddingRight: spacing[2],
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

const contentStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
  overflow: 'auto',
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
  const [searchText, setSearchText] = useState<string>('');
  const darkMode = useDarkMode();

  const { cueIntersectingRef, cueRefEl, isCueVisible, markCueVisited } =
    useGuideCue(GuideCueStorageKeys.STAGE_WIZARD_LIST);

  const filteredUseCases = useMemo(() => {
    return STAGE_WIZARD_USE_CASES.filter(({ title, stageOperator }) => {
      return title.includes(searchText) || stageOperator.includes(searchText);
    });
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
      track('Aggregation Use Case Added', {
        drag_and_drop: false,
        stage_name: useCase.stageOperator,
      });
      markCueVisited();
    },
    [onSelectUseCase, markCueVisited]
  );

  // Hide guide cue when use-case card is dragged from the list
  useDndMonitor({
    onDragStart(event) {
      if (event.active.data.current?.type === 'use-case') {
        markCueVisited();
      }
    },
  });

  return (
    <KeylineCard
      ref={cueIntersectingRef}
      data-testid="aggregation-side-panel"
      className={cx(containerStyles, darkMode && darkModeContainerStyles)}
    >
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
        placeholder="How can we help?"
        aria-label="How can we help?"
      />
      <div className={contentStyles} data-testid="side-panel-content">
        {filteredUseCases.map((useCase, index) => (
          <div key={index}>
            <GuideCue
              data-testid="stage-wizard-use-case-list-guide-cue"
              open={isCueVisible && index === 0}
              setOpen={markCueVisited}
              refEl={cueRefEl}
              numberOfSteps={1}
              popoverZIndex={2}
              title="Quick access to the stages"
              tooltipJustify="end"
              tooltipAlign="left"
            >
              Choose from the list and use our easy drag & drop functionality to
              add it in the pipeline overview.
            </GuideCue>
            <div
              ref={(r) => {
                if (index === 0) {
                  cueRefEl.current = r;
                }
              }}
            >
              <UseCaseCard
                key={useCase.id}
                id={useCase.id}
                title={useCase.title}
                stageOperator={useCase.stageOperator}
                onSelect={() => onSelect(useCase.id)}
              />
            </div>
          </div>
        ))}
        <FeedbackLink />
      </div>
    </KeylineCard>
  );
};

export default connect(null, {
  onCloseSidePanel: toggleSidePanel,
  onSelectUseCase: addWizard,
})(AggregationSidePanel);
