import { useCallback } from 'react';
import { createSlice } from '@reduxjs/toolkit';
import type { ConnectionOptions } from 'mongodb-data-service';
import type ConnectionStringUrl from 'mongodb-connection-string-url';
import type { LoadingStatus } from '../util';
import { createAsyncThunk } from '../util';
import { useDispatch } from '../util';
import type { DataService } from '../services/data-service-manager';

export type SavedAggregationsQueriesState = {
  status: LoadingStatus;
  error: string | null;
  connectionString: ConnectionStringUrl | null;
  connectionOptions: ConnectionOptions | null;
};

const initialState: SavedAggregationsQueriesState = {
  status: 'Initial',
  error: null,
  connectionString: null,
  connectionOptions: null,
};

const currentConnection = createSlice({
  name: 'currentConnection',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(connect.pending, (state) => {
      state.status = 'Fetching';
    });
    builder.addCase(connect.fulfilled, (state, action) => {
      state.status = 'Ready';
      // TODO: This breaks some major redux rules, we should not be passing
      // dataService around in actions. Refactor connection form and fix this.
      // Additionally, connection string is not serializable and we probably can
      // just pick whatever we need here instead
      state.connectionString = action.payload.getConnectionString();
      state.connectionOptions = action.payload.getConnectionOptions();
    });
    builder.addCase(connect.rejected, (state, action) => {
      state.status = 'Error';
      state.error = action.error.message ?? null;
    });
  },
});

// TODO: This is really really nasty to return dataService directly here but
// based on how connection form works there is no other way to wire things up
// without a refactor (that we should do, but I'm omitting for the PoC)
const connect = createAsyncThunk<DataService, ConnectionOptions>(
  'currentConnection/connect',
  async (connectionOptions, { extra }) => {
    return await extra.dataServiceManager.connect(connectionOptions);
  }
);

export function useConnect(): (
  connectionOptions: ConnectionOptions
  // TODO: See above
) => Promise<DataService> {
  const dispatch = useDispatch();
  return useCallback(
    async (connectionOptions: ConnectionOptions): Promise<DataService> => {
      const res = await dispatch(connect(connectionOptions));
      return res.payload as DataService;
    },
    []
  );
}

export default currentConnection.reducer;
