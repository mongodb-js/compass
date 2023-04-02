import React from 'react';
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
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import { toggleSidePanel } from '../../modules/side-panel';

const containerStyles = css({
  height: '100%',
  paddingLeft: spacing[2],
  paddingRight: spacing[2],
  paddingTop: spacing[1],
  borderBottomRightRadius: 0,
  borderBottomLeftRadius: 0,
  borderBottom: 'none',
  backgroundColor: palette.gray.light3,
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
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
});

type AggregationSidePanelProps = {
  onCloseSidePanel: () => void;
};

function AggregationSidePanel({ onCloseSidePanel }: AggregationSidePanelProps) {
  const darkMode = useDarkMode();
  return (
    <KeylineCard
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
      <div className={contentStyles}>
        <Body>Feature in progress ...</Body>
      </div>
    </KeylineCard>
  );
}

export default connect(null, {
  onCloseSidePanel: toggleSidePanel,
})(AggregationSidePanel);
