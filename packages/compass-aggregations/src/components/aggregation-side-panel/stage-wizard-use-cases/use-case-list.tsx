import React, { useState, useMemo, useRef } from 'react';
import {
  Body,
  css,
  GuideCue,
  KeylineCard,
  Link,
  spacing,
} from '@mongodb-js/compass-components';
import { STAGE_WIZARD_USE_CASES } from '.';
import { getStageHelpLink } from '../../../utils/stage';
import {
  hasSeenStageWizardListGuideCue,
  setHasSeenStageWizardListGuideCue,
} from '../../../utils/local-storage';

const cardStyles = css({
  cursor: 'pointer',
  padding: spacing[3],
});

const cardTitleStyles = css({
  display: 'inline',
  marginRight: spacing[2],
});

const useStageWizardListGuideCue = () => {
  const [isListSeen, setIsListSeen] = useState(
    hasSeenStageWizardListGuideCue()
  );

  const isGuideCueVisible = useMemo(() => {
    return Boolean(!isListSeen);
  }, [isListSeen]);

  return {
    isGuideCueVisible,
    setGuideCueVisited: () => {
      setIsListSeen(true);
      setHasSeenStageWizardListGuideCue();
    },
  };
};

const UseCaseList = ({ onSelect }: { onSelect: (id: string) => void }) => {
  const { isGuideCueVisible, setGuideCueVisited } =
    useStageWizardListGuideCue();
  const firstItemRef = useRef<HTMLDivElement | null>(null);
  return (
    <>
      {STAGE_WIZARD_USE_CASES.map(({ title, stageOperator, id }, index) => {
        return (
          <KeylineCard
            ref={(r) => {
              if (index === 0) {
                firstItemRef.current = r;
              }
            }}
            data-testid={`use-case-${id}`}
            key={index}
            onClick={() => onSelect(id)}
            className={cardStyles}
          >
            <GuideCue
              data-testid="stage-wizard-use-case-list-guide-cue"
              open={isGuideCueVisible && index === 0}
              setOpen={setGuideCueVisited}
              refEl={firstItemRef}
              numberOfSteps={1}
              popoverZIndex={2}
              title="Quick access to the stages"
              tooltipJustify="end"
              tooltipAlign="left"
            >
              Choose from the list and use our easy drag & drop functionality to
              add it in the pipeline overview.
            </GuideCue>
            <Body className={cardTitleStyles}>{title}</Body>
            <Link
              target="_blank"
              href={getStageHelpLink(stageOperator) as string}
            >
              {stageOperator}
            </Link>
          </KeylineCard>
        );
      })}
    </>
  );
};

export default UseCaseList;
