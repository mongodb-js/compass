import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';

import type { RootState, AppDispatch } from '../stores/new-export-store';

export const useExportDispatch: () => AppDispatch = useDispatch;
export const useExportSelector: TypedUseSelectorHook<RootState> = useSelector;

export const selectExportIsOpen = (state: RootState) => state.export.isOpen;

// TODO: Remove this file if we don't want to do this pattern.
