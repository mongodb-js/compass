import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type ExportState = {
  isOpen: boolean;
};

const initialState: ExportState = {
  isOpen: false,
};

export const exportSlice = createSlice({
  name: 'export',
  initialState,
  reducers: {
    setExportIsOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
    },
  },
});

export const { setExportIsOpen } = exportSlice.actions;
export const exportReducer = exportSlice.reducer;
