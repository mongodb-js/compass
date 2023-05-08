import React, { useCallback, useState } from 'react';
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
import { STAGE_WIZARD_USE_CASES, UseCaseList } from './stage-wizard-use-cases';
import { FeedbackLink } from './feedback-link';
import { addWizard } from '../../modules/pipeline-builder/stage-editor';

import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
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

const searchStyles = css({ paddingRight: spacing[2] });

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
      });
    },
    [onSelectUseCase]
  );

  return (
    <KeylineCard
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
          title="Hide Side Panel"
          aria-label="Hide Side Panel"
          onClick={() => onCloseSidePanel()}
        >
          <Icon glyph="X" />
        </IconButton>
      </div>
      <div className={searchStyles}>
        {/* @ts-expect-error leafygreen unresonably expects a labelledby here */}
        <SearchInput
          value={searchText}
          onChange={handleSearchTextChange}
          placeholder="How can we help?"
        />
      </div>
      <div className={contentStyles} data-testid="side-panel-content">
        <UseCaseList
          useCases={STAGE_WIZARD_USE_CASES.filter(
            ({ title, stageOperator }) => {
              const matchRegex = new RegExp(searchText, 'gi');
              return title.match(matchRegex) || stageOperator.match(matchRegex);
            }
          )}
          onSelect={onSelect}
        />
        <FeedbackLink />
      </div>
    </KeylineCard>
  );
};

export default connect(null, {
  onCloseSidePanel: toggleSidePanel,
  onSelectUseCase: addWizard,
})(AggregationSidePanel);
