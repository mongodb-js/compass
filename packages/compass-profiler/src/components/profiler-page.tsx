import React, { useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { ProfilerStore, ProfilerThunkDispatch, getStore } from '../stores';
import {
  ProfilerStatus,
  chooseDatabase,
  clearProfiler,
  disableProfiler,
  enableProfiler,
  pollLastProfiledQueries,
} from '../modules/profiler-state';
import { RootState } from '../modules';
import {
  Button,
  Combobox,
  ComboboxOption,
  EmptyContent,
  Icon,
  css,
} from '@mongodb-js/compass-components';
import { Document } from 'bson';
import ProfilerFlamegraph from './profiler-flamegraph';
import ProfilerSummary from './profiler-summary';

const verticalFlexStyles = css({
  display: 'flex',
  flexDirection: 'column',
});

type ProfilerIsEnabledProps = {
  onFinishProfilingSession: () => void;
  onPollProfiledQueries: () => void;
};

const ProfilerIsEnabled: React.FunctionComponent<ProfilerIsEnabledProps> = ({
  onFinishProfilingSession,
  onPollProfiledQueries,
}) => {
  useEffect(() => {
    const interval = setInterval(onPollProfiledQueries, 500);
    return () => clearInterval(interval);
  }, [onPollProfiledQueries]);

  return (
    <div className={verticalFlexStyles}>
      <EmptyContent
        icon={() => <Icon glyph="ActivityFeed" />}
        title="Profiling session in progress."
        subTitle="The profiler is currently running, all queries will be analysed once it's stopped."
        callToAction={
          <Button
            onClick={onFinishProfilingSession}
            variant="primary"
            size="large"
          >
            Stop Profiler
          </Button>
        }
      />
    </div>
  );
};

type ProfilerIsDisabledProps = {
  onEnableProfiler: () => void;
  onChooseDatabase: (db: string | undefined) => void;
  profiledQueries: Document[];
  databaseList: string[];
  database: string | undefined;
};

const ProfilerIsDisabled: React.FunctionComponent<ProfilerIsDisabledProps> = ({
  onEnableProfiler,
  onChooseDatabase,
  profiledQueries,
  databaseList,
  database,
}) => {
  return (
    <div className={verticalFlexStyles}>
      <EmptyContent
        icon={() => <Icon glyph="Dashboard" />}
        title="Profile your running application to detect bottlenecks in your MongoDB queries."
        subTitle="Only run the profiler in a safe environment, as it can degrade the performance of a running cluster."
        callToAction={
          <>
            <Combobox
              value={database}
              clearable={false}
              onChange={(v: string | null) => onChooseDatabase(v || undefined)}
            >
              {databaseList.map((db) => {
                return <ComboboxOption key={db} value={db} />;
              })}
            </Combobox>
            <Button
              onClick={onEnableProfiler}
              variant="primary"
              size="large"
              disabled={database === undefined}
            >
              Enable Profiler
            </Button>
          </>
        }
      />
      {profiledQueries.length > 0 && (
        <ProfilerFlamegraph profilingData={profiledQueries} />
      )}
    </div>
  );
};

const ProfilerPage: React.FunctionComponent<{}> = ({}) => {
  const dispatch = useDispatch<ProfilerThunkDispatch>();
  const profilerStatus = useSelector<RootState, ProfilerStatus>(
    (state) => state.profilerState.status
  );
  const profiledQueries = useSelector<RootState, Document[]>(
    (state) => state.profilerState.profiledQueries
  );
  const databaseList = useSelector<RootState, string[]>(
    (state) => state.profilerState.databaseList
  );
  const database = useSelector<RootState, string | undefined>(
    (state) => state.profilerState.database
  );

  switch (profilerStatus) {
    case 'enabled':
      return (
        <ProfilerIsEnabled
          onFinishProfilingSession={() => void dispatch(disableProfiler())}
          onPollProfiledQueries={() => void dispatch(pollLastProfiledQueries())}
        />
      );
    case 'disabled':
      if (profiledQueries.length > 0) {
        return (
          <ProfilerSummary
            profiledQueries={profiledQueries}
            onClearProfiler={() => void dispatch(clearProfiler())}
          />
        );
      }

      return (
        <ProfilerIsDisabled
          onEnableProfiler={() => void dispatch(enableProfiler())}
          onChooseDatabase={(db) => void dispatch(chooseDatabase(db))}
          profiledQueries={profiledQueries}
          databaseList={databaseList}
          database={database}
        />
      );
    case 'unknown':
      return <h1>Unknown</h1>;
  }

  return <></>;
};

const ProfilerPageConnected: React.FunctionComponent<{}> = ({}) => {
  return (
    <Provider store={getStore()}>
      <ProfilerPage />
    </Provider>
  );
};

export default ProfilerPageConnected;
