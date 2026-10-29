# @mongodb-js/compass-utilities

Entry points for Compass utilities: services that run outside the renderer. The
same file runs as an Electron utility process in Compass and as a Web Worker in
Compass Web.

## Structure

- `src/<name>/index.mts`: one utility. Desktop builds it to `<name>.mjs`.
- `src/ipc.mts`: `currentParentPort()` and `onPort()`, which work in both
  environments.
- `src/logging.mts`: `createUtilityLogger()`, which sends log lines to the host.

The service logic lives in the package that owns the service, behind a
`/utility` export (e.g. `@mongodb-js/compass-shell/utility`). This package only
wires it up.

## Adding a utility

1. Create `src/<name>/index.mts` that exports `main(parentPort)` and ends with:

   ```ts
   const parentPort = currentParentPort();
   if (parentPort) main(parentPort);
   ```

2. In `main`, accept peers with `onPort(parentPort, (port) => ...)`, one port
   per peer, and log with `createUtilityLogger(parentPort, name)`.
3. Never call `.on` or `.addEventListener` on a port. Electron ports are
   EventEmitters and browser ports are EventTargets, so use `listen`, `once` and
   `waitUntil` from `@mongodb-js/compass-utils`.
4. Register it:
   - Compass: add the name to `UTILITIES` in
     `packages/compass/src/main/application.ts`.
   - Compass Web: add a literal `new Worker(new URL(...), { type: 'module' })`
     entry to `UTILITIES` in `packages/compass-web/src/utilities.mts`. Leave it
     out if the utility needs Node.js-only features (e.g. embedded-shell's native
     addon).

Renderer code reaches a utility with `openUtilityPort(name)` from
`@mongodb-js/compass-utils` in both environments.
