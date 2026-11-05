/**
 * Preload script entry point, and the only preload module allowed to have
 * side effects. Preload has no `import.meta.main` equivalent, so keep logic in
 * other modules under `src/preload/` as exported functions that take what they
 * need (`ipcRenderer`, `window`, ...) as arguments, and only call them here.
 * That keeps them testable without loading a real preload context.
 */
import { ipcRenderer } from 'electron';
import { forwardUtilityPorts } from './utility-ports';

forwardUtilityPorts(window, ipcRenderer);
