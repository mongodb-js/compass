import { MessageBoxReturnValue, NativeImage } from 'electron';
import type { EventEmitter } from 'events';

type State =
  | 'idle'
  | 'checking'
  | 'downloading'
  | 'update-available'
  | 'no-update-available'
  | 'unsupported'
  | 'error';

declare class AutoUpdateManager extends EventEmitter {
  constructor(
    endpointURL: string,
    iconURL?: NativeImage,
    product: string,
    channel: string,
    platform: string,
    arch: string
  );
  constructor(options: {
    endpoint: string;
    product: string;
    channel: string;
    platform: string;
    icon?: NativeImage;
    arch: string;
  });
  state: State;
  releaseNotes?: string;
  releaseVersion?: string;
  endpointURL: string;
  iconURL?: NativeImage;
  version: string;
  feedURL: string;
  setupAutoUpdater(): void;
  scheduleUpdateCheck(): boolean;
  cancelScheduledUpdateCheck(): boolean;
  checkForUpdates(): true;
  enable(): boolean;
  disable(): void;
  install(): boolean;
  check(): boolean;
  emitUpdateAvailableEvent(): void;
  setState(): void;
  getState(): void;
  onUpdateNotAvailable(): Promise<MessageBoxReturnValue>;
  onUpdateError(): Promise<MessageBoxReturnValue>;
  on(name: 'state-change', handler: (state: State) => void): void;
}

export = AutoUpdateManager;
