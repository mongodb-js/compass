import React, { useState } from 'react';
import {
  css,
  cx,
  spacing,
  palette,
  useDarkMode,
  usePersistedState,
  AtlasSkillsBanner,
} from '@mongodb-js/compass-components';

import { connect } from 'react-redux';
import { useIsAIFeatureEnabled } from 'compass-preferences-model/provider';
import {
  useTelemetry,
  SkillsBannerContextEnum,
  useAtlasSkillsBanner,
} from '@mongodb-js/compass-telemetry/provider';

import PipelineHeader from './pipeline-header';
import PipelineOptions from './pipeline-options';
import PipelineSettings from './pipeline-settings';
import PipelineAI from './pipeline-ai';

import type { RootState } from '../../modules';
import PipelineResultsHeader from '../pipeline-results-workspace/pipeline-results-header';
import { PipelineToolbarContainer } from './pipeline-toolbar-container';

const headerAndOptionsRowStyles = css({
  gridArea: 'headerAndOptionsRow',
  border: '1px solid',
  borderRadius: '6px',
  borderColor: palette.gray.light2,
  padding: spacing[200],
  background: palette.white,
});

const headerAndOptionsRowDarkStyles = css({
  borderColor: palette.gray.dark2,
  background: palette.black,
});

const settingsRowStyles = css({
  gridArea: 'settingsRow',
});

const optionsStyles = css({
  marginTop: spacing[200],
});

const DISMISSED_ATLAS_AGG_SKILL_BANNER_LOCAL_STORAGE_KEY =
  'mongodb_compass_dismissedAtlasAggSkillBanner' as const;

export type PipelineToolbarProps = {
  isAIInputVisible?: boolean;
  isAggregationGeneratedFromQuery?: boolean;
  isBuilderView: boolean;
  showRunButton: boolean;
  showExportButton: boolean;
  showExplainButton: boolean;
  onHideAIInputClick?: () => void;
};

export const PipelineToolbar: React.FunctionComponent<PipelineToolbarProps> = ({
  isBuilderView,
  showRunButton,
  showExportButton,
  showExplainButton,
}) => {
  const darkMode = useDarkMode();
  const isAIFeatureEnabled = useIsAIFeatureEnabled();
  const track = useTelemetry();
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  // @experiment Skills in Atlas  | Jira Epic: CLOUDP-346311
  const [dismissed, setDismissed] = usePersistedState(
    DISMISSED_ATLAS_AGG_SKILL_BANNER_LOCAL_STORAGE_KEY,
    false
  );

  const { shouldShowAtlasSkillsBanner } = useAtlasSkillsBanner(
    SkillsBannerContextEnum.Aggregation
  );

  return (
    <PipelineToolbarContainer>
      <div
        className={cx(
          headerAndOptionsRowStyles,
          darkMode && headerAndOptionsRowDarkStyles
        )}
      >
        {isAIFeatureEnabled && isBuilderView && <PipelineAI />}
        <PipelineHeader
          isOptionsVisible={isOptionsVisible}
          onToggleOptions={() => setIsOptionsVisible(!isOptionsVisible)}
          showRunButton={showRunButton}
          showExportButton={showExportButton}
          showExplainButton={showExplainButton}
        />
        {isOptionsVisible && (
          <div className={optionsStyles}>
            <PipelineOptions />
          </div>
        )}
      </div>

      <AtlasSkillsBanner
        ctaText="Learn how to build aggregation pipelines to process, transform, and analyze data efficiently."
        skillsUrl="https://learn.mongodb.com/courses/fundamentals-of-data-transformation?team=growth"
        onCloseSkillsBanner={() => {
          setDismissed(true);
          track('Aggregation Skill CTA Dismissed', {
            context: 'Atlas Skills',
          });
        }}
        showBanner={shouldShowAtlasSkillsBanner && !dismissed}
        onCtaClick={() => {
          track('Aggregation Skill CTA Clicked', {
            context: 'Atlas Skills',
          });
        }}
      />

      {isBuilderView ? (
        <div className={settingsRowStyles}>
          <PipelineSettings />
        </div>
      ) : (
        <div className={settingsRowStyles}>
          <PipelineResultsHeader />
        </div>
      )}
    </PipelineToolbarContainer>
  );
};

const mapState = (state: RootState) => {
  return {
    isBuilderView: state.workspace === 'builder',
  };
};

export default connect(mapState)(PipelineToolbar);
