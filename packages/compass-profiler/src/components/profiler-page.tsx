import React, { useCallback, useEffect } from 'react';
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
  SpinLoader,
  css,
  palette,
  showConfirmation,
  spacing,
} from '@mongodb-js/compass-components';
import { Document } from 'bson';
import ProfilerFlamegraph from './profiler-flamegraph';
import ProfilerSummary from './profiler-summary';

const verticalFlexStyles = css({
  width: '100%',
});

const callToActionContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
});

type ProfilerIsEnabledProps = {
  onFinishProfilingSession: () => void;
  onPollProfiledQueries: () => void;
  profiledQueries: Document[];
};

const ProfilerIsEnabled: React.FunctionComponent<ProfilerIsEnabledProps> = ({
  onFinishProfilingSession,
  onPollProfiledQueries,
  profiledQueries,
}) => {
  useEffect(() => {
    const interval = setInterval(onPollProfiledQueries, 500);
    return () => clearInterval(interval);
  }, [onPollProfiledQueries]);

  return (
    <div className={verticalFlexStyles}>
      <EmptyContent
        icon={() => <SpinLoader size="80px" />}
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
      {profiledQueries.length > 0 && (
        <ProfilerFlamegraph
          profilingData={profiledQueries}
          onQueryShapeChoosen={() => {
            return;
          }}
        />
      )}
    </div>
  );
};

type ProfilerIsDisabledProps = {
  onEnableProfiler: () => void;
  onChooseDatabase: (db: string | undefined) => void;
  databaseList: string[];
  database: string | undefined;
};

const ProfilerIsDisabled: React.FunctionComponent<ProfilerIsDisabledProps> = ({
  onEnableProfiler,
  onChooseDatabase,
  databaseList,
  database,
}) => {
  const onConfirmEnableProfiler = useCallback(async () => {
    const confirms = await showConfirmation({
      title: 'Do you want to start the profiler?',
      description:
        "The profiler can degrade the performance of a running cluster while it's running.",
      variant: 'danger',
      buttonText: 'Start Profiler',
    });

    if (confirms) {
      onEnableProfiler();
    }
  }, [onEnableProfiler]);
  return (
    <div className={verticalFlexStyles}>
      <EmptyContent
        icon={() => (
          <div>
            <Icon
              width="80px"
              height="80px"
              color={palette.green.dark1}
              glyph="Dashboard"
            />
          </div>
        )}
        title="Profile your running application to detect bottlenecks in your MongoDB queries."
        subTitle="Only run the profiler in a safe environment, as it can degrade the performance of a running cluster."
        callToAction={
          <div className={callToActionContainerStyles}>
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
              onClick={() => void onConfirmEnableProfiler()}
              variant="primary"
              size="large"
              disabled={database === undefined}
            >
              Enable Profiler
            </Button>
          </div>
        }
      />
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
          profiledQueries={profiledQueries}
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
