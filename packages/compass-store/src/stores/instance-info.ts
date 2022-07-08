import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { InstanceDetails } from 'mongodb-data-service';
import { DataService } from '../services/data-service-manager';
import { actionManager, createAsyncThunk, LoadingStatus } from '../util';
import { RootState } from './root-store';

type Nullable<T> = T | Record<keyof T, null>;

// TODO: Only picking up what I need for PoC here
type InstanceInfo = {
  auth: Nullable<InstanceDetails['auth']>;
};

export type InstanceInfoState = {
  status: LoadingStatus;
  error: string | null;
} & InstanceInfo;

const initialState: InstanceInfoState = {
  status: 'Initial',
  error: null,
  auth: {
    user: null,
    roles: [],
    privileges: [],
  },
};

export const loadInstanceInfo = actionManager.debounce(
  createAsyncThunk(
    'instanceInfo/load',
    async (_: undefined, { extra, signal }) => {
      const ds: DataService =
        await extra.dataServiceManager.getCurrentConnection();
      return await ds
        .instance
        // TODO: Add support for signals in dataService
        // ({ signal });
        ();
    },
    {
      condition(_, { getState }) {
        return selectShouldFetchInstanceInfo(getState());
      },
    }
  )
);

const instanceInfo = createSlice({
  name: 'instanceInfo',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(loadInstanceInfo.pending, (state) => {
      state.status = 'Fetching';
    });
    builder.addCase(loadInstanceInfo.fulfilled, (state, action) => {
      state.status = 'Ready';
      state.error = null;
      state.auth = action.payload.auth;
    });
    builder.addCase(loadInstanceInfo.rejected, (state, action) => {
      state.status = 'Error';
      state.error = action.error.message ?? null;
    });
  },
});

export const selectAuthInfo = createSelector(
  (state: RootState) => {
    return state.instanceInfo;
  },
  (instanceInfo) => {
    return instanceInfo.auth;
  }
);

export const selectIsInstanceInfoReady = createSelector(
  (state: RootState) => {
    return state.instanceInfo.status;
  },
  (status) => {
    return status === 'Ready';
  }
);

export const selectShouldFetchInstanceInfo = createSelector(
  (state: RootState) => {
    return state.instanceInfo.status;
  },
  (status) => {
    return status === 'Initial';
  }
);

export default instanceInfo.reducer;
