import React from 'react';
import { css } from '@leafygreen-ui/emotion';
import IconButton from '@leafygreen-ui/icon-button';
import Badge, { Variant as BadgeVariant } from '@leafygreen-ui/badge';
import Icon from '@leafygreen-ui/icon';
import { spacing } from '@leafygreen-ui/tokens';
import Button from '@leafygreen-ui/button';
import { palette } from '@leafygreen-ui/palette';

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

// @experiment Skills in Atlas  | Jira Epic: CLOUDP-346311
export const AtlasSkillsBanner: React.FunctionComponent<{
  ctaText: string;
  onCloseSkillsBanner: () => void;
  onCtaClick?: () => void;
  skillsUrl: string;
  showBanner: boolean;
}> = ({ ctaText, skillsUrl, onCloseSkillsBanner, onCtaClick, showBanner }) => {
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
            d="M8 0L9.79 2.21L12.5 1.5L12 4.5L15 5.5L13.5 8L15 10.5L12 11.5L12.5 14.5L9.79 13.79L8 16L6.21 13.79L3.5 14.5L4 11.5L1 10.5L2.5 8L1 5.5L4 4.5L3.5 1.5L6.21 2.21L8 0Z"
            fill="currentColor"
          />
        </svg>
      </Badge>
      <div className={skillsCTAText}>{ctaText}</div>

      <Button
        value="Go to Skills"
        size="xsmall"
        href={skillsUrl}
        target="_blank"
        onClick={onCtaClick}
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
        onClick={onCloseSkillsBanner}
      >
        <Icon glyph="X" />
      </IconButton>
    </div>
  ) : null;
};
