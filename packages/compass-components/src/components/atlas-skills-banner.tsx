import React from 'react';
import { css } from '@leafygreen-ui/emotion';
import IconButton from '@leafygreen-ui/icon-button';
import Badge, { Variant as BadgeVariant } from '@leafygreen-ui/badge';
import Icon from '@leafygreen-ui/icon';
// @ts-expect-error - Using icon v14 via alias for Award icon
import AwardIcon from '@leafygreen-ui/icon-v14/dist/Award';
import { spacing } from '@leafygreen-ui/tokens';
import Button from '@leafygreen-ui/button';
import {
  ExperimentTestGroup,
  ExperimentTestName,
  useAssignment,
  useTelemetry,
} from '@mongodb-js/compass-telemetry/provider';
import { palette } from '..';

const skillsCTAContent = css({
  border: `1px ${palette.gray.light1} solid`,
  borderRadius: spacing[300],
  padding: spacing[300],
  paddingLeft: spacing[400],
  display: 'flex',
  width: '100%',
  alignItems: 'center',
});

const skillsCTAText = css({
  display: 'flex',
  alignSelf: 'center',
  paddingLeft: spacing[200],
});

const badgeStyles = css({
  padding: `0 ${spacing[200]}px`,
  minHeight: spacing[600],
});

const learnMoreBtnStyles = css({
  marginLeft: spacing[200],
});

const closeButtonStyles = css({
  marginLeft: 'auto',
});

// @experiment Skills in Atlas  | Jira Epic: CLOUDP-346311
export const AtlasSkillsBanner: React.FunctionComponent<{
  ctaText: string;
  onCloseSkillsBanner: () => void;
  skillsUrl: string;
  showBanner: boolean;
}> = ({ ctaText, skillsUrl, onCloseSkillsBanner, showBanner }) => {
  const track = useTelemetry();

  // Get experiment assignment for Atlas Skills Experiment
  const atlasSkillsAssignment = useAssignment(
    ExperimentTestName.atlasSkills,
    true // trackIsInSample - this will fire the "Experiment Viewed" event
  );

  // // Track experiment viewed with context when assignment is available
  // React.useEffect(() => {
  //   if (atlasSkillsAssignment?.assignment && showBanner) {
  //     track('Experiment Viewed', {
  //       test_name: `${ExperimentTestName.atlasSkills}${context ? `_${context}` : ''}`,
  //     });
  //   }
  // }, [atlasSkillsAssignment, showBanner, context, track]);

  const isInSkillsVariant =
    atlasSkillsAssignment?.assignment?.assignmentData?.variant ===
    ExperimentTestGroup.atlasSkillsVariant;

  return showBanner && isInSkillsVariant ? (
    <div className={skillsCTAContent}>
      <Badge variant={BadgeVariant.Green} className={badgeStyles}>
        <AwardIcon />
      </Badge>
      <div className={skillsCTAText}>{ctaText}</div>

      <Button
        value="Go to Skills"
        size="xsmall"
        href={skillsUrl}
        target="_blank"
        // TODO: add onClick w/ analytics
        onClick={() => {
          console.log(':::: TRACK ::::');
          track('Experiment Viewed', {
            test_name: ExperimentTestName.atlasSkills,
          });
          console.log(
            'Atlas Skills Banner: Experiment Viewed event tracked on button click',
            {
              test_name: ExperimentTestName.atlasSkills,
            }
          );
        }}
        leftGlyph={<Icon glyph="OpenNewTab"></Icon>}
        title="Go to Skills"
        className={learnMoreBtnStyles}
      >
        <span>Go to Skills</span>
      </Button>
      <IconButton
        className={closeButtonStyles}
        title="Close Atlas Skills CTA"
        aria-label="Close Atlas Skills CTA"
        onClick={() => onCloseSkillsBanner()}
      >
        <Icon glyph="X" />
      </IconButton>
    </div>
  ) : null;
};
