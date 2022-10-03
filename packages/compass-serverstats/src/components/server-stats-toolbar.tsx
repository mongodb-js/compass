import React, { useCallback, useEffect, useState } from 'react';
import d3 from 'd3';
import { Button, Icon, css, cx, spacing, uiColors, withTheme } from '@mongodb-js/compass-components';

import Actions from '../actions';
import ServerStatsStore from '../stores/server-stats-graphs-store';

const serverStatsToolbarStyles = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  padding: spacing[3]
});

const timeStyles = css({
  padding: `${spacing[2]}px ${spacing[5]}px`,
  borderRadius: '3px',
  marginLeft: spacing[2]
});

const timeLightThemeStyles = css({
  background: uiColors.gray.light2,
  color: uiColors.gray.dark1,
});

const timeDarkThemeStyles = css({
  background: uiColors.gray.dark2,
  color: uiColors.gray.light2,
});

type TimeScrubEventDispatcher = {
  on: (eventName: 'newXValue', handler: (xDate: Date) => void) => void;
};

type ServerStatsToolbarProps = {
  darkMode?: boolean;
  eventDispatcher: TimeScrubEventDispatcher
}

function UnthemedServerStatsToolbar({
  darkMode,
  eventDispatcher
}: ServerStatsToolbarProps) {
  const [ time, setTime ] = useState('00:00:00');
  const [ isPaused, setPaused ] = useState(ServerStatsStore.isPaused);

  useEffect(() => {
    eventDispatcher.on('newXValue', xDate => {
      // When the cursor position results in a new time on the graphs, by user
      // scrubbing or live viewing, we receive a new time to display.
      setTime(d3.time.format.utc('%X')(xDate));
    });
  }, []);

  const onPlayPauseClicked = useCallback(() => {
    setPaused(!isPaused)
    Actions.pause();
  }, [ isPaused ]);

  return (
    <div
      className={serverStatsToolbarStyles}
    >
      <Button
        onClick={onPlayPauseClicked}
        leftGlyph={<Icon glyph={isPaused ? 'Play' : 'Pause'} />}
        variant={isPaused ? 'primary' : 'default'}
      >
        {isPaused ? 'Play' : 'Pause'}
      </Button>
      <div
        className={cx(timeStyles, darkMode ? timeDarkThemeStyles : timeLightThemeStyles)}
        data-testid="server-stats-time"
      >{time}</div>
    </div>
  );
}

const ServerStatsToolbar = withTheme(UnthemedServerStatsToolbar);

export {
  ServerStatsToolbar
};
