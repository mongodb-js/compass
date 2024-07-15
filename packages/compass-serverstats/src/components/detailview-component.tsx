import React, { useCallback, useEffect, useState } from 'react';
import { Button, Icon } from '@mongodb-js/compass-components';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';

import Actions from '../actions';
import { useConnectionInfoAccess } from '@mongodb-js/compass-connections/provider';

function removeMS(key: string, value: any) {
  if (key === 'ms_running') {
    return undefined;
  }
  return value;
}

type CurrentOpData = {
  op: string;
  ns: string;
  ms_running: number;
  opid: number;
  client: string;
  active: boolean;
  waitingForLock: boolean;
};

export function DetailViewComponent() {
  const [data, setData] = useState<null | CurrentOpData>(null);

  const track = useTelemetry();
  const connectionInfoAccess = useConnectionInfoAccess();

  useEffect(() => {
    const unsubscribeShowOperationDetails = Actions.showOperationDetails.listen(
      (newDataToShow: CurrentOpData) => {
        setData(newDataToShow);
      }
    );
    const unsubscribeHideOperationDetails = Actions.hideOperationDetails.listen(
      () => {
        setData(null);
      }
    );

    return () => {
      unsubscribeShowOperationDetails();
      unsubscribeHideOperationDetails();
    };
  }, []);

  const hideOperationDetails = useCallback(() => {
    track(
      'DetailView hideOperationDetails',
      {},
      connectionInfoAccess.getCurrentConnectionInfo()
    );
    Actions.hideOperationDetails();
  }, [track, connectionInfoAccess]);

  const onKillOp = useCallback(() => {
    track(
      'DetailView killOp',
      {},
      connectionInfoAccess.getCurrentConnectionInfo()
    );
    if (data?.opid !== undefined) Actions.killOp(data.opid);
    hideOperationDetails();
  }, [data, track, hideOperationDetails, connectionInfoAccess]);

  if (!data) {
    return null;
  }

  return (
    <div className="rt-details">
      <header className="rt-details__header">
        <h2 className="rt-details__headerlabel">operation details</h2>
        <div className="rt-details__closebutton">
          <Button
            darkMode
            size="xsmall"
            leftGlyph={<Icon glyph="X" />}
            onClick={hideOperationDetails}
          >
            Close
          </Button>
        </div>
      </header>
      <div className="rt-details__body">
        <div className="rt-details__opinfo">
          <div className="rt-details__op">{data.op}</div>
          <div className="rt-details__collection-slow">{data.ns}</div>
          <div className="rt-details__time">{`${data.ms_running} ms`}</div>
        </div>
        <ul className="rt-details__list">
          <li className="rt-details__item">
            <div className="rt-details__datatype">opid</div>
            <div className="rt-details__datatype-val">{data.opid}</div>
          </li>
          <li className="rt-details__item">
            <div className="rt-details__datatype">client s</div>
            <div className="rt-details__datatype-val">{data.client}</div>
          </li>
          <li className="rt-details__item">
            <div className="rt-details__datatype">active</div>
            <div className="rt-details__datatype-val">{data.active}</div>
          </li>
          <li className="rt-details__item">
            <div className="rt-details__datatype">wait lock</div>
            <div className="rt-details__datatype-val">
              {data.waitingForLock}
            </div>
          </li>
          <li className="rt-details__item">
            <div className="rt-details__datatype">
              <Button
                variant="danger"
                size="xsmall"
                darkMode
                onClick={onKillOp}
              >
                Kill Op
              </Button>
            </div>
          </li>
        </ul>
        <div className="rt-details__raw">
          <span>{JSON.stringify(data, removeMS, 4)}</span>
        </div>
      </div>
    </div>
  );
}
