/* eslint-disable @mongodb-js/compass/no-leafygreen-outside-compass-components */
import React from 'react';
import { css } from '@leafygreen-ui/emotion';
import IconButton from '@leafygreen-ui/icon-button';
import Badge, { Variant as BadgeVariant } from '@leafygreen-ui/badge';
import Icon from '@leafygreen-ui/icon';
import { spacing } from '@leafygreen-ui/tokens';
import Button from '@leafygreen-ui/button';
import { palette } from '@mongodb-js/compass-components';
import {
  ExperimentTestGroup,
  ExperimentTestName,
  useAssignment,
  useFireExperimentViewed,
} from './provider';

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
  padding: '0 10px',
  minHeight: spacing[600],
});

const learnMoreBtnStyles = css({
  marginLeft: spacing[200],
});

const closeButtonStyles = css({
  marginLeft: 'auto',
});

export enum SkillsBannerContextEnum {
  Documents = 'documents',
  Aggregation = 'aggregation',
  Indexes = 'indexes',
  Schema = 'schema',
}

// Helper hook for components that want to show the Atlas Skills banner
export const useAtlasSkillsBanner = (context: SkillsBannerContextEnum) => {
  const atlasSkillsAssignment = useAssignment(
    ExperimentTestName.atlasSkills,
    false
  );

  const isInSkillsVariant =
    atlasSkillsAssignment?.assignment?.assignmentData?.variant ===
    ExperimentTestGroup.atlasSkillsVariant;

  // Track experiment viewed when user is in experiment and banner would be shown
  useFireExperimentViewed({
    testName: ExperimentTestName.atlasSkills,
    shouldFire: !!atlasSkillsAssignment,
    additionalProperties: { screen: context },
  });

  return {
    shouldShowAtlasSkillsBanner: isInSkillsVariant,
  };
};

// @experiment Skills in Atlas  | Jira Epic: CLOUDP-346311
export const AtlasSkillsBanner: React.FunctionComponent<{
  ctaText: string;
  onCloseSkillsBanner: () => void;
  skillsUrl: string;
  showBanner: boolean;
}> = ({ ctaText, skillsUrl, onCloseSkillsBanner, showBanner }) => {
  return showBanner ? (
    <div className={skillsCTAContent}>
      <Badge variant={BadgeVariant.Green} className={badgeStyles}>
        {/* Custom SVG for award icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7.86523 4.50095C7.91495 4.37545 8.08505 4.37545 8.13477 4.50095L8.58203 5.63056C8.60293 5.68332 8.64988 5.71981 8.7041 5.72453L9.86621 5.82242C9.99499 5.83357 10.0474 6.00227 9.94922 6.09063L9.06445 6.88644C9.023 6.92372 9.00492 6.98243 9.01758 7.03817L9.28711 8.22749C9.31712 8.35959 9.18073 8.46438 9.07031 8.3939L8.07617 7.75568C8.0296 7.72581 7.9704 7.72581 7.92383 7.75568L6.92969 8.3939C6.81926 8.46437 6.68288 8.35959 6.71289 8.22749L6.98242 7.03817C6.99508 6.98243 6.977 6.92372 6.93555 6.88644L6.05078 6.09063C5.95261 6.00227 6.00503 5.83356 6.13379 5.82242L7.2959 5.72453C7.35011 5.7198 7.39706 5.68331 7.41797 5.63056L7.86523 4.50095Z"
            fill="#000"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M8 1.3999C10.7614 1.3999 13 3.64376 13 6.41169C13 7.54003 12.6278 8.58111 12 9.41877V13.5975C12 14.1511 11.5523 14.5999 11 14.5999H10.9727C10.8025 14.5999 10.635 14.5565 10.4863 14.4736L8 13.0856L5.51367 14.4736C5.36498 14.5565 5.1975 14.5999 5.02734 14.5999H5C4.44772 14.5999 4 14.1511 4 13.5975V9.41877C3.37223 8.58111 3 7.54003 3 6.41169C3 3.64376 5.23858 1.3999 8 1.3999ZM11 10.4201C10.1642 11.0496 9.1259 11.4235 8 11.4235C6.8741 11.4235 5.83577 11.0496 5 10.4201V13.5975H5.02734L7.51367 12.2095C7.81599 12.0409 8.18401 12.0409 8.48633 12.2095L10.9727 13.5975H11V10.4201ZM8 2.40226C5.79086 2.40226 4 4.19734 4 6.41169C4 8.62604 5.79086 10.4211 8 10.4211C10.2091 10.4211 12 8.62604 12 6.41169C12 4.19734 10.2091 2.40226 8 2.40226Z"
            fill="#000"
          />
        </svg>
      </Badge>
      <div className={skillsCTAText}>{ctaText}</div>

      <Button
        value="Go to Skills"
        size="xsmall"
        href={skillsUrl}
        target="_blank"
        // TODO: add onClick w/ analytics
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
