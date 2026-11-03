# @mongodb-js/compass-events

Helpers that treat DOM `EventTarget`s (including `AbortSignal` and `MessagePort`) and Node.js-style emitters (`EventEmitter`, Electron's `MessagePortMain` and `parentPort`) the same way, so code shared between Compass desktop and Compass Web does not need to know which one it has.

- `listen` adds a listener and returns a `Disposable` that removes it.
- `once` and `waitUntil` resolve with the arguments of the next matching event.
- `addAbortListener` listens once for `abort` and returns a `Disposable`.
- `abortable` rejects a promise as soon as an `AbortSignal` aborts.
- `errorFromEvent` gets the `Error` behind an `error` event.
