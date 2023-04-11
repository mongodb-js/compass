import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';

import type {
  RootExportState,
  ExportAppDispatch,
} from '../stores/new-export-store';

export const useExportDispatch: () => ExportAppDispatch = useDispatch;
export const useExportSelector: TypedUseSelectorHook<RootExportState> =
  useSelector;

export const selectExportIsOpen = (state: RootExportState) =>
  state.export.isOpen;

// TODO: Remove this file if we don't want to do this pattern.
