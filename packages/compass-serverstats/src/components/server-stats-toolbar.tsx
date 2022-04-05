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

type D3EventDispatcher = {
  on: (eventName: string, handler: (eventProps: any) => void) => void;
};

type ServerStatsToolbarProps = {
  darkMode?: boolean;
  eventDispatcher: D3EventDispatcher
}

function UnthemedServerStatsToolbar({
  darkMode,
  eventDispatcher
}: ServerStatsToolbarProps) {
  const [time, setTime] = useState('00:00:00');
  const [ isPaused, setPaused ] = useState(ServerStatsStore.isPaused);

  useEffect(() => {
    eventDispatcher.on('newXValue', xDate => {
      // TODO: How do we clean up this event handler? d3 dispatch?
      // The time is from the mouse x position on the d3 graphs, the graphs send this event.
      setTime(d3.time.format.utc('%X')(xDate));
    });
  }, [ /* Run on first mount. */ ]);

  const onPlayPauseClicked = useCallback(() => {
    setPaused(!isPaused)
    Actions.pause();
  }, [ isPaused ]);

  // <div className="time-and-pause action-bar">

  return (
    <div
      className={serverStatsToolbarStyles}
    >
      <Button
        onClick={onPlayPauseClicked}
        // TODO: Cleanup rtss styles from package.
        // className="play btn btn-xs btn-primary"
        leftGlyph={<Icon glyph={isPaused ? 'Play' : 'Pause'} />}
        variant={isPaused ? 'primary' : 'default'}
        data-test-id="performance-play"
        // size="small"
        // style={{
        //   display: paused ? null : 'none'
        // }}
      >
        {isPaused ? 'Play' : 'Pause'}
      </Button>
      {/* <button
        onClick={this.handlePause.bind(this)}
        className="pause btn btn-default btn-xs"
        data-test-id="performance-pause"
        style={{display: paused ? 'none' : null}}>
        <span className="pausebutton">
          <i className="fa fa-pause" />
          PAUSE
        </span>
      </button> */}
      <div
        className={cx(timeStyles, darkMode ? timeDarkThemeStyles : timeLightThemeStyles)}
      >{time}</div>
      {/* <div className="time"><span className="currentTime">{time}</span></div> */}
    </div>
  );
}

const ServerStatsToolbar = withTheme(UnthemedServerStatsToolbar);

export {
  ServerStatsToolbar
};
