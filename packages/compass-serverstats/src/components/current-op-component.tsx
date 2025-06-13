import React, { useCallback, useEffect, useState } from 'react';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { useConnectionInfoRef } from '@mongodb-js/compass-connections/provider';

// No types exist for these files
/* eslint-disable @typescript-eslint/no-require-imports */
const timer = require('d3-timer');
const Actions = require('../actions');
const DBErrorStore = require('../stores/dberror-store');
/* eslint-enable @typescript-eslint/no-require-imports */

type Row = {
  ns: string;
  op: string;
  ms_running: number;
};

/**
 * Represents the component that renders the current op information.
 */
const CurrentOpComponent: React.FunctionComponent<{
  store: any;
  interval: number;
}> = ({ store, interval }) => {
  const [state, setState] = useState<{
    error: Error | null;
    data: Row[];
    display: string;
  }>({
    error: null,
    data: [],
    display: 'flex',
  });

  useEffect(() => {
    return store.listen((error: any, data: any) => {
      setState((prevState) => {
        return { ...prevState, error, data };
      });
    });
  }, [store]);

  useEffect(() => {
    return Actions.showOperationDetails.listen(() => {
      setState((prevState) => {
        return { ...prevState, display: 'none' };
      });
    });
  }, [store]);

  useEffect(() => {
    return Actions.hideOperationDetails.listen(() => {
      setState((prevState) => {
        return { ...prevState, display: 'flex' };
      });
    });
  }, [store]);

  useEffect(() => {
    if (!DBErrorStore.ops.currentOp) {
      const timerInterval = timer.interval(() => {
        Actions.currentOp();
      }, interval);
      const unsubscribe = DBErrorStore.listen(() => {
        timerInterval.stop();
      });
      return () => {
        timerInterval.stop();
        unsubscribe();
      };
    }
  }, [interval, store]);

  const track = useTelemetry();
  const connectionInfoRef = useConnectionInfoRef();

  const showOperationDetails = useCallback(
    (data) => {
      track('CurrentOp showOperationDetails', {}, connectionInfoRef.current);
      Actions.showOperationDetails(data);
    },
    [connectionInfoRef, track]
  );

  if (state.error) {
    return (
      <div className="rt-lists" style={{ display: state.display }}>
        <header className="rt-lists__header">
          <h2 className="rt-lists__headerlabel">Slowest Operations</h2>
        </header>
        <div className="rt-lists__empty-error">&#9888; DATA UNAVAILABLE</div>
      </div>
    );
  }

  if (state.data.length === 0) {
    return (
      <div className="rt-lists" style={{ display: state.display }}>
        <header className="rt-lists__header">
          <h2 className="rt-lists__headerlabel">Slowest Operations</h2>
        </header>
        <div data-testid="no-slow-operations" className="rt-lists__empty-error">
          &#10004; No Slow Operations
        </div>
      </div>
    );
  }

  const rows = state.data.map((row, i) => {
    return (
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
      <li
        className="rt-lists__item rt-lists__item--slow"
        onClick={() => {
          showOperationDetails(row);
        }}
        key={`list-item-${i}`}
      >
        <div className="rt-lists__op">{row.op}</div>
        <div className="rt-lists__collection-slow">{row.ns}</div>
        <div className="rt-lists__time">{String(row.ms_running) + ' ms'}</div>
      </li>
    );
  });

  return (
    <div className="rt-lists" style={{ display: state.display }}>
      <header className="rt-lists__header">
        <h2 className="rt-lists__headerlabel">Slowest Operations</h2>
      </header>
      <div className="rt-lists__listdiv" id="div-scroll">
        <ul className="rt-lists__list">{rows}</ul>
      </div>
    </div>
  );
};

export default CurrentOpComponent;
export { CurrentOpComponent };
