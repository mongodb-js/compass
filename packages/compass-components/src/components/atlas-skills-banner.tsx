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
        <Icon glyph="Award" />
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
        Go to Skills
      </Button>
      <IconButton
        className={closeButtonStyles}
        title="Dismiss Skills Banner"
        aria-label="Dismiss Skills Banner"
        onClick={onCloseSkillsBanner}
      >
        <Icon glyph="X" />
      </IconButton>
    </div>
  ) : null;
};
