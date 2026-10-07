# Fact Finding: Enabling Electron recommended security settings in Compass

The following is a summary of the electron landscape and what is needed to make these settings possible for us. 

Author's Note: I used AI to help me navigate the details and size of the abstractions we'd need to migrate. I even started chopping away at the Node.js polyfill approach to get a sense of its enormity. That being said all the text below is written by me in my voice (for better or for worse) so it is a stream of consciousness rather than formal TD.

What does it take to turn on each of these, what does it break and how much work is it to unbreak:

1. Set `nodeIntegration: false` \- breaks every renderer import of `electron`, every Node.js builtin that runs when its module loads, and the shell loading its runtime from disk at run time. Unbroken by moving DataService, import/export, the assistant's tools, and the shell into utility processes, routing the renderer's Electron use through the preload script, and moving file access to Main. This is most of the work below.  
2. Set `nodeIntegrationInWorker: false` \- only the embedded shell depends on it: its runtime is a web worker that has Node.js only because of this flag. Unbroken by running the shell in a utility process (see Embedded shell).  
3. Set `contextIsolation: true` \- breaks anything the preload script shares with the renderer through globals. On the PoC branch that is how the renderer gets `ipcRenderer`, `webFrame`, `webUtils`, `shell` and a few `app` getters. Unbroken by exposing a narrow contextBridge API instead. Small, once nodeIntegration is off.  
4. Set `enableRemoteModule: false` \- this is on by default and has been deprecated. Breaks the renderer's native open/save dialogs and the app name/version/user data getters, which all go through @electron/remote. Unbroken by moving dialogs to Main and having Main pass the app details to the preload script. Small.

## **nodeIntegration: false and nodeIntegerationInWorker: false**

# Background and Node.js level Polyfills

Electron exposes Node.js APIs directly to the render so, for example, the DataService React-level abstraction is able to import and use MongoDB driver APIs which in turn lead to using "net"/"tls" APIs not normally available in a browser environment. Since Electron v12 context isolation has been on by default and node integration off. This forces implementers using Electron to declare an explicit boundary between their frontend business logic and system resource access points. This can come in a few different forms:

1. IPC between renderer and main \- by preloading a custom library of helpers the renderer can fire events in the main "node.js" process to kick off native system type tasks like file reads etc. Useful for stateless operations, more work to manage resources with a lifecycle.  
   1. "contextBridge" is a tool to expose APIs into your renderer, you can make values/functions available in the globalThis of the renderer to give your frontend code things it would never normally have in a browser.  
2. [Channel Messaging API](https://developer.mozilla.org/en-US/docs/Web/API/Channel_Messaging_API) \- much like IPC, though it isn't Electron-specific. Electron facilitates the setup of a channel between renderer and main, and custom channels can be created for specific long-lived resources that perform a lot of duplex communication."  
   1. It is possible to fork a new node.js process that directly talks to a MessagePort, so separate from main, you could have a "file system reader" dedicated process that's sole job is to provide FS access to the renderer via this channel. Increases isolation and bounds responsibilities  
3. Use browser native APIs: FileSystem picker, WebSockets, etc.  
   1. If justified / reasonable.

Today, Compass is built on the assumption that the renderer and nodejs APIs live as one, and that leads to *a ton* of code that needs to be refactored to use alternative APIs (either through source changes or through a bundler). Unlike Compass-Web, Compass cannot tolerate less than the full feature set available today. For example, compass-web is only possible because of many features that were decided to not be made available and never will be, some examples:

Compass Web *never* has to deal with

* Auth: SCRAM, AWS, Kerberos, LDAP, OIDC, x.509  
* SSH proxy, SOCKS proxy  
* SRV connection string resolution nor TXT resolution  
* CSFLE: Automatic nor explicit  
* File system for: TLS certs/keys/ca lists for client and FLE, Env detection (client metadata), OIDC token  
* Compression: snappy, zstd  
* Http requests or servers  
  * Server for OIDC auth via oidc-plugin  
  * Requests for OIDC auth via driver and KMS Req via driver  
* Child process exec for mongocryptd

Since compass-web has a greatly reduced set of features we were able to create a Compass for the browser by carefully refactoring to move certain imports that would be impossible to polyfill into the right places where we could then use webpack to fill in alternatives to make it possible to use the Node.js driver in the browser over a WebSocket. This meant we could avoid a redesign of the abstractions in Compass itself; the Data Service remained something that just invokes driver methods directly.   
Even taking a look into the polyfills written for compass-web an overwhelming majority of the code is stub functions that throw exceptions if they are called. We simply needed a number of functions to exist but not function to get past the point of resolving/loading the javascript code. We acknowledge that a fs.promises.readFile function that *always* throws an Error is acceptable because we are never going to use an API path in compass-web that needs to read a file.

The road to context isolation is a long one; unlike before, we need more custom solutions that can't be provided at the layer of bundling. There are some fundamental things that are simply never going to be possible over the 3 methods of communication in an context-isolated electron mentioned above. 

* Any synchronous file reads are fundamentally impossible, and the code that performs them isn't code we've written; it's library code.  
* C++ addons are unlike Node.js stdlib APIs. Whereas we can write fs.readFile and be confident that we've satisfied the API requirement due to its unchanging longevity in the ecosystem and complete documentation, we cannot say the same for kerberos, or mongodb-client-encryption, etc.

Instead, the idea would be to elevate the abstractions up into our application logic — for example, the Data Service is now implemented to make the IPC calls and/or use contextBridge-provided APIs. By bringing the implementation of how the renderer interacts up to the application, this also means we need to design for compass-web as well. No longer can it just replace the Node.js APIs that the driver needs but we need to preload a global prior to compass-web that equivalently provides what the electron IPC normally would. 

---

# Research application level abstraction

In order to pull off context isolation and no use of Node.js APIs we must introduce layers of abstraction that separate the direct use of the certain node APIs and mostly the mongodb driver by compass.

We can abstract at higher layers of the Compass "stack" to get an easier to write boundary between the renderer and Node.js. There's two ideas: RPC the driver, RPC the data-service. 

RPC the driver would look like making a set of classes that mirror the driver's API but in reality deliver and receive requests over a channel to a nodejs utility process over a MessageChannel.

RPC the data-service would look like taking the more high-level APIs that data service offers and proxying that over the message channel. For example, the `indexes` API \- 

* MongoClient.db,   
* MongoClient.startSession  
* Db.collection,   
* Db.aggregate,   
* Db.command  
* Collection.indexes,   
* Collection.aggregate,   
* Collection.find  
* AggregationCursor.toArray/.close  
* FindCursor.toArray/.close (+ ClientSession.id property read)

Would run all these driver APIs inside the utility process and only expose \-   
`async indexes(ns: string, options?: IndexInformationOptions, executionOptions?: ExecutionOptions): Promise<IndexDefinition[]> {`  
Via an RPC. 

| service | node surface (src grep) | strategy | size |
| :---- | :---- | :---- | :---- |
| connection-storage | fs, crypto (main-side already) | done — reference impl | 0 |
| compass-user-data | fs, os, path; write-file-atomic | a third `IUserData` implementation in the renderer (next to `FileUserData` and `AtlasUserData`) that calls Main through a purpose-built contextBridge global; Main runs `FileUserData`. No general FS in the renderer | S |
| preferences-model | fs, crypto, os; yargs-parser via global-config.ts, url via parse-record.ts | same pattern, on top of `IUserData`; web access variant already exists. Main already parses global config (`main/index.ts:34`), the renderer only reaches global-config.ts through the package index | S |
| compass-logging | stream (mongodb-log-writer) | renderer formats lines itself and passes strings to a contextBridge global, fire and forget, to the writer already in Main. No utility process. `mongoLogId` already re-implemented | S |
| data-service | via driver deps | RPC at the DataService API: DataServiceRenderer proxy in the renderer, DataServiceImpl in a utility process, a transfer layer for BSON/AbortSignal/callbacks, cursor-draining features become APIs. Working on the PoC branch | L |
| compass-import-export | fs streams \+ cursors | move engine to the utility as DataService APIs; renderer keeps UI \+ passes file paths; file dialogs via main \+ webUtils.getPathForFile. Export moved; import APIs stubbed and the renderer rewired to them | M–L (mostly relocation) |
| compass-shell | web Worker given Node.js by nodeIntegrationInWorker, via @mongosh/node-runtime-worker-thread; runtime `require` of that package from disk | runtime in a utility process; its existing message RPC reused over a MessagePort \+ lifecycle messages; two upstream changes to the runtime package | M |
| compass-generative-ai (assistant tools) | mongodb-mcp-server (express, prom-client, …), NodeDriverServiceProvider | boundary at the tool layer: `listDatabaseTools` \+ `performToolCall`; MCP server and its connection in the utility | M |
| hadron-ipc \+ Electron in the renderer | electron, @electron/remote, v8 | replace hadron-ipc with the DataService IPC helpers over a renderer-to-Main MessagePort (in-page loopback on web); `webFrame`/`webUtils` via contextBridge; dialogs \+ app details via main | M |
| export-to-language (bson-transpilers) | vm (sandboxed eval), fs via the antlr4 index | deep-import antlr4; transpile in the utility | S |
| compass-connection-import-export | fs | Main reads or writes the file the user picked; the renderer only sees connections | S |
| connection telemetry (app/utils/telemetry.ts) | dns via resolve-mongodb-srv and mongodb-cloud-info | move to the utility | S |
| app bootstrap (app/index.ts) | dns (`setDefaultResultOrder` for the driver), main-only setup-hadron-distribution | dns tuning moves with the driver; setup already split | S |
| atlas-service | crypto (`createHash`) | replace | S |
| packages with browser builds (vfile, debug, supports-color, @vscode/l10n) | path, process, url, os, tty, fs | resolve their browser builds | S |

## **Data Service Abstraction**

A new implementation of DataServiceImpl (lets call it RemoteDataService) that implements the same API as before and internally talks over a MessageChannel to a utility process. I propose we use RemoteDataService in all environments; it speaks over a transport that handles serialization and deserialization over the IPC connection. The real DataServiceImpl of today is invoked by a receiver side of the transport abstraction. On web where none of this is necessary that transport is replaced with code that simply invokes functions.

For example, desktop

1. opening the indexes tab in Compass leads to an invocation of   
2. remoteDataService.indexes() which will call   
3. transport.rcp('indexes', arguments) which will   
4. mc.port1.send("encoded indexes req") and await the reply.   
5. Any message delivered to the utility process must first be decoded to formulate a structured request, then  
6. The transport('newMessage') event on the utility process-side will fire with { req: 'indexes', arguments } leading to an invocation of   
7. dataServiceImpl.indexes(...arguments), when it resolves,   
8. transport.mc.port2.send('indexes', response)  
9. Which will resolve the promise created in remoteDataService.indexes() (step 2\)

For example, web

1. opening the indexes tab in Compass leads to an invocation of   
2. remoteDataService.indexes() which will call   
3. transport.rcp('indexes', arguments) which will   
4. Directly dispatch the event that would normally go over IPC transport.emit('newMessage'...), bypassing serialize/deserilize and just getting the JS data over to the API we need to call.  
5. dataServiceImpl.indexes(...arguments), when it resolves,   
6. transport.mc.port2.send('indexes', response)  
7. Which will resolve the promise created in remoteDataService.indexes() (step 2\)

```
UI plugins (unchanged: dataServiceLocator / connectFn)
    └─> RemoteDataService (proxy implements DataService)
            └─> ServiceRpcTransport (the only platform-specific piece)
                  desktop: MessagePort ──> UtilityProcess: real DataService + MongoClient(s)
                                            + kerberos/CSFLE/OIDC/tunnels + import-export engine
                  web:     loopback (in-page) ─> same ServiceHost dispatch ─> same DataService
                                            over websocket net/tls polyfills (unchanged)
```

utilityProcess is a Chromium utility process with an embedded Node.js runtime — not plain Node.js.

From the Electron source: utilityProcess.fork creates a Chromium child process (--type=utility \--utility-sub-type=node.mojom.NodeService) that hosts a Node service via Mojo. It's the same multi-process infrastructure as Chromium's GPU/network/storage helpers, but instead of rendering or networking, it runs Node's V8 \+ JS engine. So: Chromium's process lifecycle/sandbox/IPC \+ Node's JS runtime, no window, no DOM.

The practical consequences we hit:

execArgv goes to Chromium's command-line parser (WithExtraCommandLineSwitches), not Node's process.execArgv — so Node CLI flags like \--frozen-intrinsics are silently ignored by Chromium and never reach Node. That's why your probes didn't crash.  
NODE\_OPTIONS env reaches Node's CLI parser, but Electron gates it behind the nodeOptions fuse and filters it (strips most flags in packaged apps).  
IPC is Mojo/MessageChannel (the parentPort), not Node's stdin/stdout pipe.  
No Chromium UI — it's headless, just process infra \+ Node.  

More utilityProcess gotchas we hit on the PoC branch:

* `MessagePortMain` in the utility is a Node.js EventEmitter (`on`/`once`), the renderer's `MessagePort` is a DOM EventTarget (`addEventListener`). Both need an explicit `.start()` when you listen that way (on the DOM side, assigning `port.onmessage` starts it implicitly).  
* `--frozen-intrinsics` isn't reachable (see execArgv above), and even through a path that does reach Node it breaks two things: core-js, which babel was injecting into our Node.js targets through `useBuiltIns: 'usage'` (now limited to web targets in webpack-config-compass `loaders.ts`), and `depd` (via express), which assigns `Error.prepareStackTrace`.  
* `WebpackPluginStartElectron` is a singleton keyed on the webpack target. Every extra `electron-main` config (utility entries, preload) steals it from the real main compiler and races which one launches the app, so those configs filter it out.

---

# Measuring the renderer: the stdlib report

To get an honest work list I added a webpack plugin (`packages/compass/scripts/fail-on-node-stdlib.js`) to the renderer config. It lists every Node.js builtin the renderer bundle imports, both `node:fs` and bare `fs`, with the chain of imports that brought it in, merged into one tree so a module responsible for many imports shows up once. It writes `packages/compass/node-stdlib-report.txt` and warns; it can be switched to fail the build.

Things I learnt getting the numbers right:

* Webpack makes **one** ExternalModule per distinct builtin, so counting modules counts builtins, not work. Worse, tracing the shortest path to each one names a single importer and hides the rest. write-file-atomic imports `fs`, `node:crypto`, `path`, `util` and `worker_threads`, but only `worker_threads` showed up, because nothing closer to the entry imports it. The report now lists every module that imports each builtin.  
* A `require` inside a try/catch is detectable at build time: webpack sets `dependency.optional = Boolean(parser.scope.inTry)` (CommonJsImportsParserPlugin). The report lists those separately and doesn't count them. write-file-atomic's `worker_threads` and mongodb-log-writer's `v8` are the two today. A runtime check like antlr4's `var fs = isNodeJs ? require("fs") : null` is not a try/catch, so it still counts, even though it would never run in the renderer.  
* Once builtins are mapped to empty modules (see Polyfills) they stop being ExternalModules and become RawModules whose identifier is `ignored|<context>|<request>`. The report reads those too.  
* It can't see code webpack generates. With ESM output and CommonJS externals, webpack puts `import { createRequire } from "node:module"` at the top of the chunk. There's no module in the graph for it, and it fails before any Compass code runs.  
* It can't see globals. `Buffer`, `process` and `global` aren't imports.

| | imports | builtins | importing modules |
| :---- | :---- | :---- | :---- |
| main @ `ad926b4e0d` | 653 | 56 | 377 |
| PoC branch, same method | 52 | 17 | 33 |
| PoC branch now | 31 (\+ 2 in try/catch) | 10 | 24 |

The last row isn't comparable to the first two. After I turned off the externals presets, bare imports of builtins that also exist as npm packages started resolving to whatever copy was in `node_modules`, which took them off the count without anyone deciding to polyfill them. That's certain for `util` (see Polyfills); `process`, `assert` and `buffer` are installed too, so bare imports of them resolve the same way.

Where main's biggest offenders went:

* node-fetch (57), @smithy/node-http-handler (48), mongodb (42), ssh2 (32), express (26), devtools-proxy-support (17), oidc-plugin, devtools-connect: left with the driver. node-fetch mostly went with its importers, and webpack-config-compass now aliases `node-fetch` (and its deep imports) to a shim over the platform `fetch`.  
* 337 of the 653 were under `compass-generative-ai/src/tools-controller.ts`: mongodb-mcp-server, a second copy of express, prom-client, and NodeDriverServiceProvider, which brings devtools-connect and oidc-plugin with it.  
* @babel/core (29): the shell's async rewriter. The shell is commented out on the PoC branch.  
* compass-import-export: 25 down to 2.

What's left, by the fix it needs:

| fix | count | from |
| :---- | :---- | :---- |
| resolve browser builds | 9 | vfile 4, @vscode/l10n 2, supports-color 2, debug 1 |
| file access in Main | 11 | compass-preferences-model 3, yargs-parser 2, compass-user-data 2, write-file-atomic 2, compass-connection-import-export 2 |
| move to the utility | 5 | bson-transpilers 2 (`vm`), mongodb-cloud-info 1, resolve-mongodb-srv 1, app/index.ts 1 (`dns`) |
| import from a leaf module | 3 | antlr4 2, data-service 1 |
| trivial | 2 | compass-import-export toasts, `path.basename` for display |
| replace | 1 | atlas-service `createHash` |

## Barrel imports

The most common way driver code reached the renderer was a package's index file, not the feature using it:

* `app/utils/telemetry.ts` imported `configuredKMSProviders`, a pure function, from `mongodb-data-service`. The index also exported `DataServiceUtility` and imported `instance-detail-helper` → `run-command` → the driver. 33 imports through one line.  
* `DataServiceRenderer`, whose whole point is to not have the driver, imported the same function from `instance-detail-helper`: 21 imports.  
* The fix was a leaf module (`kms-providers.ts`) and splitting the package entry: `mongodb-data-service` is renderer-safe, `mongodb-data-service/utility` exports `DataServiceUtility`. `connect` stays in the renderer-safe entry because on this branch it builds a `DataServiceRenderer`.  
* hadron-ipc's index imports its main-process half, which imports `electron`. It now has a `hadron-ipc/renderer` entry.  
* compass-generative-ai's `provider.tsx` imports `ToolsController` at the top, so importing `AtlasAiServiceProvider` from it pulled in mongodb-mcp-server.  
* antlr4's index loads `FileStream` and `CharStreams`, which use `fs`. bson-transpilers only uses `InputStream` and `CommonTokenStream`, on strings.  
* Still open: `createProjectionFromSchemaFields` lives in `cursor/gather-fields.ts`, which imports `stream/promises`.

Gotcha: Compass resolves workspace packages to their TypeScript source through a `compass:exports` field, which webpack checks before `exports` (`exportsFields: ['compass:exports', 'exports']`). A new subpath has to go in both or it silently doesn't resolve.

## Import and export

* `modules/import.ts` opened files at five call sites: `fs.createReadStream` for guessing the file type, listing CSV fields, analyzing CSV fields and importing, plus `fs.exists`/`fs.stat` for file info. Each now calls DataService with a file path.  
* The renderer built the error log path with `path.join` and a `mkdir` under the user data folder, so it can't pick the path any more. The utility derives it, creates it, and returns it on the result.  
* `getImportFileInfo` (exists, size) feeds the progress bar and the "file is gone" check. It's not driver work and could as easily be a Main call.  
* The CSV vocabulary (`Delimiter`, `Linebreak`, `CSVField`, the detectable and parsable type unions) is copied into `data-service/src/import/import-types.ts`, because compass-import-export depends on data-service and not the other way round. When import really moves, those should live in data-service and be re-exported.  
* Things that turned up on the way: `csv-utils.ts` used `assert` for two internal checks (now plain throws), `modules/export.ts` imported `gatherFieldsFromQuery` only for a `typeof` and had an unused `fs` import, and `createProjectionFromSchemaFields` existed in both packages.  
* On the PoC branch the import APIs are stubs that throw, so import doesn't work there.

## Embedded shell

* The boundary today is `new Worker(pathToFileURL(workerProcessPath).href)` in `@mongosh/node-runtime-worker-thread/src/index.ts:68`. `Worker` isn't imported: it's the browser global. Node.js has no global `Worker`, and this one has Node.js only because of `nodeIntegrationInWorker: true` (`window-manager.ts:233`).  
* The shell's Redux store owns it: `createRuntime` and `destroyCurrentRuntime` in `stores/store.ts`, keeping handles in a module-level `RuntimeMap`. The React component only gets the runtime as a prop, and browser-repl's `Shell` is plain React. So the UI is already separate from the transport.  
* It doesn't share DataService's connection. `createWorkerRuntime` reads `dataService.getMongoClientConnectionOptions()` and opens its own connection in the worker: it shares configuration, not a connection. That's why `DataServiceRenderer` still answers `getMongoClientConnectionOptions` synchronously.  
* The runtime talks to its worker with postmsg-rpc, bound through `getRPCOptions` in `rpc.ts:27` to `addEventListener`/`removeEventListener`. Electron's `MessagePortMain` only has `on`, `once`, `postMessage`, `start` and `close`. `worker_threads.Worker` only has `on`. `worker_threads` MessagePort has both.  
* `worker-runtime.ts` loads the package with `__non_webpack_require__`/`require.resolve` and rewrites `.asar` to `.asar.unpacked`, because the worker file has to exist on disk next to the library. That's why it's in `sharedExternals`, and why webSecurity is off in development: only so the renderer can load a `file://` worker.  
* The worker is worth keeping inside the utility. mongosh evaluates whatever the user types, and `interruptor` plus `worker.terminate()` are what stop a `while (true) {}` without killing the host. On the utility's main thread a hung script blocks that whole process and everything else it hosts.  
* The two package changes: `worker_threads.Worker` instead of the global, and `on` instead of `addEventListener`. Arguably overdue, since the package is named for Node.js worker threads but only runs where there's a DOM `Worker`.  
* The `tty` in the report has nothing to do with the shell. It's debug checking whether stdout is a terminal, through supports-color.

## Assistant tools

* `ToolsConnectionManager` has one consumer, `ToolsController` (`tools-controller.ts:139`), created by `ToolsControllerProvider`. compass-assistant uses it at four call sites: `setActiveTools`, `setContext` and `setConnectionIdForToolCall` take plain data; `getActiveTools` returns an AI SDK `ToolSet` of `execute` closures, the only part that can't cross.  
* `getActiveTools` has three independent groups, and only `db-read` reaches the driver. Its `execute` body is already the RPC: find the connection for the tool call, `connectToCompassConnection`, `toolBase.invoke(args, { signal })`, `disconnect`. The result, `CallToolResult`, is `{ content: [...], isError? }`, plain JSON.  
* Each tool's `argsShape` is a zod shape, which can't be cloned. Sending JSON Schema instead and using the AI SDK's `jsonSchema()` (exported from `ai`) means `removeZodTransforms` can go; it only exists to strip zod transforms before the AI SDK sees the schema.  
* The connection string and options cross and the utility opens its own connection, the same duplication as the shell.  
* On the PoC branch `ToolsController` is stubbed in `provider.tsx` to keep mongodb-mcp-server out of the renderer.

## Electron in the renderer

* hadron-ipc's renderer is `electron.ipcRenderer` plus `call`, `callQuiet` and `createInvoke`. 21 non-test files use it, 14 in the renderer and 7 in main. Main keeps `ipcMain` unchanged.  
* The renderer uses it four ways: fire-and-forget (`callQuiet` for telemetry and logging); request/response with cancellation (`createInvoke` for connection storage and Atlas sign-in, which sends `ipcHandlerInvoke`/`ipcHandlerAborted` around each call and revives serialized errors); pushes from main (`compass:preferences-changed`, `broadcast`); and raw `invoke` (preferences' `renderer-ipc.ts`).  
* `serialized-error.ts` used `v8.serialize` only to test whether a property survives IPC. `structuredClone` does the same test in a browser; done.  
* Other Electron use in the renderer, all removed from the bundle on the PoC branch: `application.tsx` (`webUtils`, `webFrame`, and `@electron/remote` for the app name, version and file picker), `compass-utils/src/electron.ts` (a try/catch `require('@electron/remote')` for the storage path that pulled in all of @electron/remote), `open-file.ts` (`shell.openPath`), `export-modal.tsx` (the save dialog), and `setup-hadron-distribution.ts` (main-only `app`, `protocol`, `net`; now split into a renderer half).  
* How the PoC does it: the preload script defines `__COMPASS_IPC_RENDERER__` and `__COMPASS_ELECTRON__` on `globalThis`. That only works with contextIsolation off. The preload's `app` getters still use @electron/remote, and native file dialogs throw.  
* contextBridge copies values and proxies functions, but it doesn't copy prototype methods, so exposing `ipcRenderer` itself would lose its EventEmitter methods. Electron also advises against exposing it for security. I also wouldn't rely on a callback keeping its identity through the bridge, and preferences' `renderer-ipc.ts:86` calls `removeListener(listener)`, so subscribing should return an unsubscribe function.  
* I'd worried that logging and telemetry fire during module initialisation, before a MessagePort could be set up. It shouldn't matter: the renderer creates the channel itself, so it can post straight away, and a port holds messages until the other end calls `start()`. That's the web platform's behaviour; I still want to confirm it holds once one end has been handed to Main as a `MessagePortMain`.  
* The four ways the renderer uses hadron-ipc map onto the DataService helpers: requests with ids for `call`/`invoke`/`createInvoke` (the AbortSignal handling replaces `ipcHandlerInvoke`/`ipcHandlerAborted`, and error revival replaces `serialized-error.ts`), one-way messages for `callQuiet`, and event delivery for pushes like `compass:preferences-changed`. `broadcast` means Main keeps a port per window and posts to each.  
* Main's side (`respondTo`, `createHandler`, `handle`) becomes handlers registered with the helpers. Main holds a `MessagePortMain`, the same as the utility, so the utility-side helpers run there unchanged.

## Polyfills and resolution

* Builtins were external because `target: 'electron-renderer'` turns on webpack's node and electron externals presets, and externals are matched before resolution, so `resolve.fallback` never ran. Turning the presets off (`node`, `electron`, `electronRenderer`, `electronPreload`) and falling back every builtin to `false` maps them to empty modules.  
* That's also what removes `node:module`. With ESM output (`output.module: true`), webpack can't `require()` a CommonJS external, so it generates `createRequire(import.meta.url)` from `node:module`. No CommonJS externals, no `createRequire`.  
* The side effect: with the presets off, a bare `util` resolves to whatever is hoisted. That was util 0.10.3, a transitive copy, and Compass failed with `util.inherits is not a function`. compass pins util ^0.12.5 now, like compass-web. Bare `process`, `assert` and `buffer` still resolve to whatever is installed, and need a decision. (`punycode` looks like one but isn't: tr46 asks for `"punycode/"`, the npm package, on purpose.)  
* The renderer's `ProvidePlugin` replaces the browser's own `URL` and `URLSearchParams` with whatwg-url. Once the renderer is a browser that's probably unnecessary, and whatwg-url is what brings in tr46 and punycode.  
* `stream$` and `events$` are exact-match aliases, so `stream` doesn't also claim `stream/promises` (compass-web orders its keys instead). `util/types` comes before `util$`, and points at a shim that re-exports `types.*`, because the util package only has `types` as a property.  
* The renderer ignores packages' browser builds on purpose. webpack-config-compass sets `aliasFields: []` for the renderer with the comment "To avoid resolving the `browser` field" (COMPASS-5048, when the renderer had Node.js and the Node.js builds were the right choice), overriding webpack's own default of `['browser']` for `electron-renderer`, and it only adds `'browser'` to `mainFields` for `web` and `webworker` targets. debug uses the string form (`"browser": "./src/browser.js"`, which also drops supports-color) so it needs `mainFields`; vfile and @vscode/l10n use the object form to swap individual files, so they need `aliasFields`. I haven't tried turning them back on yet, and it changes resolution for every package with a `browser` field.  
* Export conditions matter in the same way. lru-cache's `exports` has a browser build under `import`, but its `require` branch has only one build and it uses `node:diagnostics_channel`. The renderer's conditions include `node`, so the ESM consumer got the node build and a CommonJS consumer can't get anything else. It's out of the renderer now, but only because both its importers left.  
* compass-web provides `Buffer` and `process` with `ProvidePlugin`. The renderer still reads `process.type` in `setup-hadron-distribution-renderer.ts:53`, and bson-transpilers passes `Buffer` into its sandbox.

## Cost of restoring BSON prototypes

I benchmarked the `Object.setPrototypeOf` restore against creating a fresh instance and copying fields across, in Node 24, 5 BSON values per document, median of 7 runs:

| docs | BSON values | setPrototypeOf | create \+ assign |
| :---- | :---- | :---- | :---- |
| 20 | 100 | 0.016 ms | 0.013 ms |
| 100 | 500 | 0.066 ms | 0.029 ms |
| 10,000 | 50,000 | 4.12 ms | 1.70 ms |
| 100,000 | 500,000 | 40.7 ms | 23.5 ms |

It's up to about 2.4 times slower, on numbers that are tiny: 3 µs for a page of 20 documents. Reading two properties from each restored value afterwards was faster after `setPrototypeOf` (10.6 ms against 17.7 ms at 100,000 documents), and `%HasFastProperties` was true for every approach, so nothing dropped into dictionary mode. `setPrototypeOf` keeps the cloned object's shape and only swaps the prototype link; copying fields onto a new object builds a new shape. The classic advice against `setPrototypeOf` is about changing prototypes of objects that hot, shared code paths use, not a one-off fix-up of objects that were just created.

Caveats: the create \+ assign version stands in for a real constructor-based restore; this ran in Node.js, not the renderer; and a microbenchmark can't rule out V8 pessimising unrelated code. `--trace-deopt` on a real Compass session would. There may still be reasons to construct real instances, such as BSON classes with private fields that a prototype swap can't fake, but performance isn't one of them.
