# Plan: remove Node.js APIs from compass-import-export and ship it in Compass Web

## Goal

Make `@mongodb-js/compass-import-export` run with no Node.js or Electron APIs, so that the same code serves both Compass desktop and Compass Web. File access moves to web platform APIs:

- **Import** reads a `File` from `<input type="file">`. This works in every browser.
- **Export** writes through `showSaveFilePicker()` and `FileSystemWritableFileStream`. Only Chromium has these, so import / export targets **Chromium only**: Electron, Chrome and Edge. In other browsers Compass Web hides the feature entirely (see "Browser support").
- **Temporary storage** for the two-pass CSV export uses the Origin Private File System (OPFS).

Stream processing keeps the Node stream programming model. Code keeps importing `stream`, which the shared ESLint plugin config allows and which Compass Web aliases to [`readable-stream`](https://github.com/nodejs/readable-stream) v4.

`Readable.fromWeb` / `Writable.fromWeb` can't bridge web streams here:

- readable-stream v4 (checked up to 4.8.0) only ships stubs that throw `TypeError: lazyWebStreams(...).newStreamReadableFromReadableStream is not a function`.
- Node.js's own `fromWeb` rejects streams that the renderer's DOM creates.

So the package carries two small adapters, `readableFromWeb` and `writableFromWeb`, in `src/utils/web-streams.ts`.

## Non-goals

- Rewriting the parsing pipeline on WHATWG `TransformStream`. Through `readable-stream`, the existing `Transform` classes, `stream-json` and `papaparse` keep working.
- Import error log files (see Phase 5). Logging isn't the focus of this work.
- Export support for Firefox and Safari.

## Current state

The business logic is already independent of I/O. Every core function receives its streams from the caller:

| Function                                                            | Signature (abridged)                          |
| ------------------------------------------------------------------- | --------------------------------------------- |
| `importCSV`, `importJSON`, `doImport`                               | `{ input: Readable, output?: Writable, ... }` |
| `guessFileType`, `listCSVFields`, `analyzeCSVFields`                | `{ input: Readable, ... }`                    |
| `exportJSONFromQuery/Aggregation`, `exportCSVFromQuery/Aggregation` | `{ output: Writable, ... }`                   |
| `gatherFields`                                                      | `{ input: Readable, ... }`                    |

Node.js and Electron APIs are concentrated in a few places:

| API                                                             | Where                                                                        | Purpose                                                     |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `fs.createReadStream`                                           | `modules/import.ts` (4 call sites)                                           | read the source file in select, preview, analyze and import |
| `fs.exists`, `fs.stat`                                          | `modules/import.ts`                                                          | existence check, file size for progress                     |
| `fs.createWriteStream`                                          | `modules/export.ts`                                                          | export output                                               |
| `fs.createWriteStream` / `createReadStream` / `rm`, `os.tmpdir` | `export/export-csv.ts`                                                       | temp `.jsonl` file for the two-pass CSV export              |
| `fs.mkdir`, `fs.createWriteStream`, `getStoragePath`            | `modules/import.ts`                                                          | import error log under `userData/ImportErrorLogs`           |
| `path.basename`, `path.join`                                    | `modules/import.ts`, `export-csv.ts`, `import-toast.tsx`, `export-toast.tsx` | display names, temp and log paths                           |
| `os.EOL`                                                        | `import/import-utils.ts`                                                     | newline in the error log                                    |
| `util.promisify`, `util.TextDecoder`                            | `modules/import.ts`, `utils/utf8-validator.ts`, `import/guess-filetype.ts`   |                                                             |
| `Buffer.from(value, 'base64')`                                  | `csv/csv-utils.ts`                                                           | parse CSV binData cells                                     |
| `stream`, `stream/promises`                                     | most files under `import/`, `export/`, `utils/`                              | the processing pipeline                                     |
| `@electron/remote` dialog                                       | `components/export-modal.tsx`                                                | save dialog                                                 |
| `electron` `shell.openPath`                                     | `utils/open-file.ts`                                                         | open the error log                                          |
| `hadron-ipc` `show-file`                                        | `utils/reveal-file.ts`                                                       | "Show in folder" after export                               |
| `FilePickerDialog` (Electron backend, path strings)             | `components/import-file-input.tsx`                                           | import file selection                                       |

Compass Web already aliases `stream` to `readable-stream` and polyfills `fs` with stubs that throw ([compass-web/webpack.config.js](../compass-web/webpack.config.js)). It also sets `enableImportExport: false` ([compass-web/src/preferences.tsx](../compass-web/src/preferences.tsx)). The plugins are registered only in desktop ([compass/src/app/components/workspace.tsx](../compass/src/app/components/workspace.tsx)).

## Approach

Swap only the I/O edges. Leave the pipeline as it is.

```ts
import { readableFromWeb, writableFromWeb } from '../utils/web-streams';

// import source
const input = readableFromWeb(file.stream());

// export target
const output = writableFromWeb(await fileHandle.createWritable());
```

`Readable.push()` converts `Uint8Array` chunks to `Buffer` (from the `buffer` polyfill on web), so the existing transforms see the same chunk type as today.

## Phases

Each phase can be merged on its own and keeps desktop working.

### Phase 0: Guard rails

- No new dependencies (see Approach).
- The shared `@mongodb-js/eslint-config-compass/plugin` config already bans Node.js built-ins (except `assert`, `stream` and `events`) and `electron` / `@electron/remote`. This package turns that rule off for `src/**`. Phase 6 removes the override, keeping it only for `scripts/**`.
- The rule doesn't catch `require()` calls or `hadron-ipc`, so check those by hand.

### Phase 1: Platform-neutral core

These changes don't affect behavior.

- `pipeline` from `stream/promises` becomes `promises.pipeline` from `stream`. Compass Web's `stream/promises` polyfill throws.
- `util.TextDecoder` becomes the global `TextDecoder`.
- `Buffer.from(value, 'base64')` in `csv-utils.ts` becomes `Binary.createFromBase64(value, subtype)` from `bson`.
- Add `readableFromWeb` / `writableFromWeb`. The writable side implements `writev`, so chunks that queue up behind a pending write go out as one write. That is the write batching from Phase 3.
- `stream-json` and `strip-bom-stream` `require('stream')` internally. Desktop resolves that to Node's module and web to `readable-stream`, and the two interoperate.

### Phase 2: Import from a `File`

- **Selection.** `FilePickerDialog` returns path strings, which doesn't work on web, and it is deprecated in favor of `FileSelector`. `ImportFileInput` uses `FileSelector`, which reports `File` objects. The input keeps the id `import-file_file_input`, because e2e `browser.selectFile` targets it. React doesn't wire `onCancel` for `<input>`, so the native `cancel` event is caught where it bubbles up to a wrapper element.

- **State.** Replace `fileName: string` and `fileStats: fs.Stats` with `file: File`, and derive the name and size from it. The import store already holds non-serializable values (`abortController`, `analyzeAbortController`), so this follows the existing pattern.
- **Thunks.** `selectImportFile` (was `selectImportFileName`), `loadCSVPreviewDocs`, `loadTypes` and `startImport` each open `readableFromWeb(file.stream())`. A `File` can be re-read cheaply. Remove the `checkFileExists` check.
- **Chunk boundaries.** `File.stream()` chunks can split a multi-byte character, and papaparse decodes every chunk on its own (`chunk.toString()`), which turned split characters into U+FFFD. This already affected preview and type analysis. `Utf8Validator` now emits decoded text, so chunks end on character boundaries.
- **Read errors.** `guessFileType` and `listCSVFields` used `.pipe()`, which doesn't forward source errors, so a read error hung or crashed them. They now listen on the source.
- **Modified files.** Reading a `File` whose file on disk changed after selection throws `NotReadableError`. Map that error to "The file changed since it was selected. Select it again."
- **UTF-8 decoding is fatal.** Invalid UTF-8 fails the import, following `TextDecoder` rules (`new TextDecoder('utf-8', { fatal: true })`). This is a behavior change:
  - Today `selectImportFileName` and `startImport` open the file with `createReadStream(fileName, 'utf8')`. Node decodes with `StringDecoder`, which replaces invalid bytes with U+FFFD before `Utf8Validator` sees them.
  - So in production, invalid UTF-8 imports with replacement characters. The `"The encoded data was not valid for encoding utf-8"` handling in `modules/import.ts` never runs on those paths.
  - `file.stream()` yields raw bytes, so `Utf8Validator` now rejects them as the specs already expect.
  - Keep the validator as the single decode point. Don't add a `TextDecoderStream` in front of it.
  - Call out the change in the release notes.

### Phase 3: Export to a `FileSystemFileHandle`

- **Selection.** Replace the `@electron/remote` dialog in `export-modal.tsx` with this call:
  ```ts
  const handle = await window.showSaveFilePicker({
    suggestedName: `${ns}.${fileType}`,
    types: [{ description: fileType, accept: { [mime]: [`.${fileType}`] } }],
  });
  ```
  The call must stay inside the click handler, because the API requires user activation.
- **State.** `runExport` receives the handle instead of `filePath`, and the toast title uses `handle.name`.
- **Output.** `writableFromWeb(await handle.createWritable())`. Remove the `outputWriteStream.close()` from `finally`, because `pipeline` ends or destroys the stream.
- **Cancel semantics change.** `createWritable()` writes to a swap file. The data only becomes visible on `close()`, and `abort()` discards it. `runExport` destroys an output that didn't finish, so a cancelled or failed export leaves an empty file (the picker already created it) instead of a partial one. The cancelled toast no longer offers "show file".
- **Write batching.** Each `FileSystemWritableFileStream.write()` is an IPC round trip to the browser process, and the exporters emit one small chunk per document. `writableFromWeb` implements `writev` (Phase 1), so chunks that queue up behind a pending write are sent as one.
- **Fix the write after end in the JSON export.**
  - `export-json.ts` pushes `]` in the transform's `final`. Then its `finally` block writes `]\n` to `output` again, after `pipeline` has already ended or destroyed the stream.
  - That write is silently dropped, both by Node.js and by readable-stream, because the stream is already destroyed. The expected fixtures (for example `test/docs/all-bson-types.exported.default.ejson`) end in `]` with no trailing newline.
  - Fix: delete the `output.write(']\n')` in `finally`. The output stays byte-identical to today, so the existing fixture assertions don't change.
  - The spec records writes made after `output.writableEnded`, and expects none.
- **"Show in folder".** A handle exposes no filesystem path. Remove the toast action and `utils/reveal-file.ts`. The `show-file` IPC handler in `compass/src/main/window-manager.ts` stays: other packages use it.
- **Picker errors.** `AbortError` (the user closed the dialog) is ignored. Other errors show in the existing "Error creating output file" banner.
- **Electron.** Checked in an Electron 45 probe of a `file://` page with `nodeIntegration`: secure context, `showSaveFilePicker` present, OPFS read / write works, and `readableFromWeb` / `writableFromWeb` round-trip data with Node's `stream`. An aborted writable leaves the file empty. The picker dialog itself was not exercised (it needs a person).

### Phase 4: CSV temp file in OPFS

- In `export-csv.ts`, replace `os.tmpdir()` and `fs` with:
  ```ts
  const dir = await navigator.storage.getDirectory();
  const tmp = await dir.getFileHandle(`export-csv-${random}.jsonl`, {
    create: true,
  });
  // write: writableFromWeb(await tmp.createWritable())
  // read:  readableFromWeb((await tmp.getFile()).stream())
  // clean: await dir.removeEntry(tmp.name)
  ```
- A crash leaves orphaned files behind. When an export starts, delete `export-csv-*` entries older than a day.
- OPFS counts against the origin's storage quota. Chromium's `QuotaExceededError` message is readable as is and reaches the failed toast, so there is no custom copy.
- We rejected re-running the cursor in place of a temp file: the second pass isn't a consistent snapshot, so its columns could differ from the header written from the first pass.

### Phase 5: Import error log

Done together with Phase 2, because the `startImport` rewrite touched the same code.

- Remove the on-disk error log: `getErrorLogPath`, `getUserDataFolderPath`, `errorLogFilePath` in state, `utils/open-file.ts`, and the "View log" toast action.
- Keep the in-memory `firstErrors` (the first 5 errors) shown in the UI. Keep the error count.
- Remove the `output` option from `importCSV` / `importJSON` / `doImport`. `doImport` only reported database write errors to `errorCallback` when `output` was set, so it now always reports them. Without that, dropping the log would have hidden write errors from the UI.
- If users still need the full log later, collect it in OPFS and offer a download through `URL.createObjectURL`. That's out of scope here.

### Phase 6: Clean up dependencies

- Remove `@electron/remote`, `@mongodb-js/hadron-ipc` and `@mongodb-js/compass-utils` from `package.json`. Move `electron` to `devDependencies`, because `electron-mocha` needs it. Run `npm run depcheck`.
- Remove the lint override for `src/**`. It stays for `scripts/**`.

### Phase 7: Enable in Compass Web

- Render `<ImportPlugin>` and `<ExportPlugin>` in `compass-web/src/entrypoint.tsx`, matching desktop `workspace.tsx`.
- `compass-import-export` exports `isImportExportSupported()`. It checks for `window.showSaveFilePicker` and `navigator.storage.getDirectory`.
- `compass-web/src/preferences.tsx` sets `enableImportExport: isImportExportSupported()`. Every entry point (CRUD toolbar, add-data menu, document list, aggregation "Export") already checks that preference. So in browsers without the APIs, the feature stays hidden as it is today, and no per-browser logic is needed.
- The export modal keeps a guard for a missing `showSaveFilePicker` as a backstop.
- Remove `skipForWeb` from the import, export and aggregation-export e2e tests.

## Browser support

| Capability    | API                                    | Chromium (Electron, Chrome, Edge) | Firefox | Safari |
| ------------- | -------------------------------------- | --------------------------------- | ------- | ------ |
| Import        | `<input type="file">`, `File.stream()` | yes                               | yes     | yes    |
| Export target | `showSaveFilePicker`, `createWritable` | yes                               | no      | no     |
| CSV temp file | OPFS `createWritable`                  | yes                               | yes     | verify |

Firefox and Safari get neither import nor export until they ship these APIs. No fallbacks are planned.

## Testing

- **Unit specs.** Core specs keep using Node `fs.createReadStream` fixtures. That's fine, because `readable-stream` and Node streams interoperate. The whole suite also passes with `stream` aliased to readable-stream 4.5.1 (Compass Web's polyfill) through a require hook.
- **Thunk / component specs.** Build `File` objects instead of temp paths. jsdom's `File` has no `.stream()`, so `test/files.ts` builds them with Node's `File`. For export, a fake handle's `createWritable()` returns a `WritableStream` that collects chunks. An in-memory fake stands in for OPFS.
- **E2E, import.** `browser.selectFile(Selectors.ImportFileInput, path)` keeps working against the `<input type="file">`.
- **E2E, export.** WebdriverIO can't drive `showSaveFilePicker`. Keep the `selectExportFileName` event, but pass a name. The page creates an OPFS handle with that name and hands it to `runExport`. The new `browser.readExportedFile` reads the result back from OPFS instead of `fs.readFile`. The same hook works for desktop and web.

## Risks

| Risk                                                                                   | Mitigation                                                                            |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Throughput regression from per-chunk IPC writes                                        | `writev` batching in `writableFromWeb`. Benchmark a 1 GB export before and after.     |
| Twice the disk space during export (swap file), three times for CSV (OPFS temp + swap) | Document it. Most exports are far below disk limits.                                  |
| Users relying on partial files after a cancel                                          | Clear cancel toast copy.                                                              |
| Fatal UTF-8 decoding rejects files that import today                                   | Intended (Phase 2). Release note. Error copy already points users at the encoding.    |
| `showSaveFilePicker` behavior in Electron (permissions, modal blocking e2e)            | API availability verified in Electron 45. The real dialog still needs a manual check. |

## Decisions

1. Import uses the existing `FileSelector`. `FilePickerDialog` is deprecated, so it isn't extended.
2. "Show in folder" (export) and "View error log" (import) are removed on desktop too.
3. Target Chromium only. Browsers without the APIs don't get import / export at all, through `isImportExportSupported()`. There are no fallbacks.
4. Invalid UTF-8 is fatal, using `TextDecoder` rules.
5. The CSV export keeps its two-pass design, with the temp file in OPFS.
