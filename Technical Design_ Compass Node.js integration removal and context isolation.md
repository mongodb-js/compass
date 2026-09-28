# Technical Design: Compass Node.js integration removal and context isolation

Author: [Neal Beeken](mailto:neal.beeken@mongodb.com)
[Epic: COMPASS-10741](https://jira.mongodb.org/browse/COMPASS-10741)
[Please add your LGTM to WRITING-39914](https://jira.mongodb.org/browse/WRITING-39914)

| Design Review Crew |  |
| :---- | :---- |
| Informed Participants |  |

# Design Decisions

Compass will set the "contextIsolation" flag to true and "nodeIntegration" and "nodeIntegrationInWorker" flags to false. In tandem these remove access to Node.js APIs from "frontend" render code.

To get there:

* **Node.js work moves out of the renderer at the service layer, not the driver layer.** Each service that needs Node.js (DataService, the embedded shell, the assistant's database tools) gets a renderer-side proxy that speaks a small message protocol to the real implementation running in a utility process.
* **DataService is the path from the Compass UI to MongoDB**, apart from the shell and the assistant's tools, which keep their own connections. Features that drain a cursor to completion (schema analysis, export, field gathering, import) become DataService APIs instead of holding cursors across the process boundary.
* **The renderer reaches Electron only through the preload script.** The renderer bundle contains no `electron`, `@electron/remote`, or main-process code. What the preload exposes is purpose-built, such as writing a log line or reading stored preferences, never general access such as the file system.
* **Polyfilling is minimal.** The renderer uses packages' own browser builds, three of the browser-compatible replacements compass-web uses (`stream`, `events`, `util`), and maps every other Node.js builtin to an empty module. A build-time report tracks what is left.

# Detailed Design

Components

* **Renderer Process** \- A chrome browser tab that takes HTML and web compatible javascript and renders it to a window
* **Main Process** \- A Node.js process that can control and communicate with the renderer
* **Preload script** \- A script executed before the renderer begins and can use an API called contextBridge to create and load APIs into the renderer [globalThis](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis)
* **Utility Process** \- A Node.js process separate from Main, forked by Main, that has a MessageChannel setup between itself and the renderer process. Compass may run more than one.

## DataServiceRenderer and DataServiceUtility

DataServiceRenderer implements the DataService interface in the renderer and contains no driver code. DataServiceUtility is a subclass of the existing DataServiceImpl that runs in a utility process. DataServiceUtility is created every time the renderer constructs a DataServiceRenderer instance. An initial postMessage in the renderer delivers a [MessageChannel](https://developer.mozilla.org/en-US/docs/Web/API/MessageChannel) port, by way of the preload script and Main, to the [utilityProcess](https://www.electronjs.org/docs/latest/api/utility-process), creating the link between render and utility. Every asynchronous DataService API is implemented in DataServiceRenderer to instead send the name of the method and its arguments to the utility process. DataServiceUtility is subscribed to message events and each message will carry that method and arguments to invoke. The outcome of the method, success or failure, is sent back to the render to replicate the expected behavior of Promises resolving/rejecting. Each request carries an id, so concurrent calls resolve correctly regardless of the order their replies arrive in.

The few synchronous DataService APIs (for example `isConnected` and `isWritable`) are answered in the renderer from state it already has: the result of connecting and the topology events described below.

On compass-web the same boundary applies, but the transport is an in-page loopback that calls DataServiceImpl directly without serializing.

## hadron-ipc

hadron-ipc is how the renderer talks to Main today, for telemetry, connection storage, Atlas sign-in, find in page, menus and more. It depends on `electron` being importable in the renderer, and on compass-web it does nothing.

We will replace every use of hadron-ipc with the IPC helpers built for DataService, pulled out of DataService so any service can use them. They already cover what hadron-ipc does:

* Requests matched to their replies by id, which covers `call`, `invoke` and `createInvoke`
* One-way messages, which covers `callQuiet`
* Events sent from the other side, which covers subscribing to channels that Main broadcasts on
* BSON values, AbortSignals and callbacks, as described below

The renderer opens a MessageChannel to Main at startup and hands one end over through the preload script, just as it does for DataService. Main listens on its end with the same helpers the utility uses, since both hold the same kind of port. Messages sent before Main starts listening wait in the port, so calls made during startup need nothing extra. On compass-web the helpers run over the in-page loopback, so a service can have a web implementation without a second code path.

## IPC

The postMessage API deep clones JavaScript values. Most notably, the prototype chain is not walked or duplicated. Which means BSON values lose their type information. Additionally AbortSignals which carry listeners for the abort event cannot work across this boundary, and functions cannot be cloned at all.

### BSON

The BSONValue instances when cloned only bring their enumerable properties across the IPC boundary.

| `{ objectId: new ObjectId('424242424242424242424242') }` |
| :---- |
| `{ objectId: { i0: 4342338, i1: 4342338, i2: 4342338, i3: 4342338 } }` |

The value is no longer distinguishable from a nested document and cannot be rendered properly in all the machinery that depends on ObjectId instances etc.

In order to revive the BSONValues to be their proper type again we can save a reference to every BSON type in the results we get back from the driver and restore the plain object's prototype to the corresponding BSONValue class on either side of IPC. We can infallibly determine if a given object is meant to be a BSONValue by relying on the guarantee that instance equality is preserved across the clone boundary.

| `{ data: { objectId: *ObjectId() }, bsonValue: new Map([[*{...}, 'ObjectId']]) }` |
| :---- |
| `{ data: { objectId: *{ i0, i1, i2, i3 } }, bsonValue: new Map([[*{...}, 'ObjectId']]) }` |

In the example above the object marked with an asterisk is the same instance. When the Map is transferred all the keys will be the BSONValues throughout the result or error of the DataService API. For every key [set the prototype of the object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/setPrototypeOf) to the BSON class indicated by the name stored as the Map value.

Restoring prototypes this way was measured to cost microseconds for a page of documents and does not slow later property access (see Fact Finding).

### AbortSignal

AbortController and their companion AbortSignal API provide a mechanism for Compass to provide cancellation to operations. The AbortSignal allows for each layer of code to subscribe to an abort event delivered when the AbortController is told to abort(). The IPC boundary supports this by replacing each AbortSignal found in the arguments with an empty placeholder object before the message is sent. Much like BSON, the placeholders are identified on the other side by instance equality.

| `dataService.find(ns, filter, {}, { abortSignal: controller.signal })` |
| :---- |
| `{ requestId: 7, args: [ns, filter, {}, { abortSignal: *{} }], placeholders: [*{}] }` |

The renderer adds an abort handler to the original signal that sends an "abort" message carrying the request's id. The utility replaces each placeholder with the signal of a new AbortController that it keys to that request id, and aborts it when the "abort" message arrives. The cancelled operation then rejects through the normal response path.

### Cursors

Unlike most return values from DataService APIs, cursors have a lifetime and hold state for iterating a query. In order to avoid the complexity of translating that lifecycle over the process boundary we will remove the use of cursors at the DataService API boundary. We are able to do this because the cursors are all streamed to completion so we can move the business logic into the utility process and return the final result:

* schema-analysis.ts:49 \- sampleCursor runs analyzeDocuments(), becomes `analyzeSchema`
* export-csv.ts:287 \- writes an agg/find to a file, which would need to move to the Node.js process anyway, becomes `exportToFile` with a format option
* export-json.ts:130 \- same as above
* gather-fields.ts:154 \- a cursor is run through analysis and a reduced GatherFieldsResult is returned with schema paths, becomes `gatherFields`

### Events

The DataService has a few events that it forwards from the driver notably "topologyDescriptionChange" events. These are trivially serialized and sent over the IPC boundary to be emitted on the renderer-side. We can always forward these events and allow listeners to only be managed renderer-side rather than reflecting subscriptions and unsubscription over on utility.

### OIDC Auth Callback

The OIDC `notifyDeviceFlow` callback that's passed to the connect layer is a function, so it cannot be cloned. When connecting, the renderer tells the utility whether it has one. If it does, the utility installs a stand-in callback. When the driver invokes the stand-in, the utility sends a "deviceFlow" message carrying the verification URL and user code. The renderer invokes its real callback, which shows the device-auth modal, then replies with success or the error, and the stand-in resolves or rejects accordingly.

This is the general pattern for any callback that has to cross the boundary: a stand-in on one side, a message with an id, and a reply that settles it.

## Import and Export

Import and export read and write files and drain cursors, so their engines move into the utility process as DataService APIs. The renderer keeps the UI and the Redux stores, and passes file paths rather than streams.

* Export: `exportToFile` (JSON or CSV, chosen by an option) and `gatherFields`
* Import: `getImportFileInfo`, `guessFileType`, `listCSVFields`, `analyzeCSVFields`, `importFromFile`

Progress and per-document errors, which are callbacks today, come back as an `importProgress` event. The utility owns the import error log: it derives the path, creates the file, and returns the path so the renderer can show it. Native open and save dialogs move to Main (see Electron APIs in the Renderer).

## Embedded Shell

The shell runs entirely in a utility process, with its own driver connection as it has today.

Today the renderer's shell store creates the shell runtime (`@mongosh/node-runtime-worker-thread`), which starts a web worker that has Node.js only because nodeIntegrationInWorker is on. The runtime already talks to that worker over message-based RPC with its own serialization. We reuse that RPC across the renderer to utility boundary, and add a few lifecycle messages for what the renderer can no longer do itself: request a runtime for a connection, and terminate it. Inside the utility, the runtime keeps its worker thread, so a runaway script can still be interrupted without blocking the process hosting it.

The runtime package needs two changes: use Node.js worker threads rather than the browser `Worker` global, and use EventEmitter listeners rather than `addEventListener` on the Node.js side. The renderer no longer loads the runtime from disk at run time, which also lets us re-enable webSecurity in development.

## Assistant Tool Calls

The boundary for the assistant's database tools sits at the tool layer, not at the driver abstraction the tools use internally (NodeDriverServiceProvider). The renderer keeps ToolsController, its context, and the tools that only read renderer state (current query, current pipeline, the connection error debugger). The utility hosts the MCP server, its connection manager, and the driver. Two calls cross:

* `listDatabaseTools` returns each tool's name, description, and input schema as JSON Schema
* `performToolCall` takes the tool name, its arguments, the connection to use, and an optional AbortSignal, and returns the tool result, which is already plain data

The renderer builds its tool definitions from the JSON Schema, which also removes the need to strip zod transforms before handing schemas to the AI SDK.

## Electron APIs in the Renderer

Beyond hadron-ipc, the renderer uses a few Electron APIs directly. They come from the preload script:

* `webFrame` (zoom) and `webUtils` (the file path of a dropped or picked file) are exposed through contextBridge as functions
* The app name, version, and user data path are passed from Main to the preload script
* Native open and save dialogs, and opening a file, become requests to Main over the IPC helpers. This replaces the renderer's use of `@electron/remote`

Logging and stored user data get their own purpose-built contextBridge globals (see below). DataService keeps its own MessagePort straight to the utility, bypassing Main, since it carries far more traffic.

## Logging

Logging works differently from the services above: nothing needs to run in a utility process. Main already owns the log writer that puts log files on disk. The renderer formats each log line itself, in the format MongoLogWriter writes, and passes the string to a global that the preload script exposes through contextBridge for exactly that purpose. It is fire and forget. The renderer no longer builds a MongoLogWriter, which is a Node.js stream, only to format lines. Because the preload script runs before any renderer code, lines logged during startup are delivered like any others.

## User Data and Preferences

Preferences, saved queries and pipelines, and data models are stored through compass-user-data, which already hides where data lives behind one interface, `IUserData`, with a file implementation for desktop (`FileUserData`) and a REST implementation for compass-web (`AtlasUserData`). We keep that seam. On desktop the renderer gets a third implementation whose methods (read one, read all, write, update, delete, each scoped to a type of data) call Main through a purpose-built contextBridge global, and Main runs `FileUserData`. The renderer never gets a general file system API: each call names the kind of data, never a path.

Preferences sit on top of this as they do today, so their callers keep using `getPreferences` and the rest. Main already parses global configuration files and command-line options, so the renderer only receives the result. Connection import and export follow the same rule: Main reads or writes the file the user picked, and the renderer only sees the connections.

## Other Renderer Node.js Usage

* **Connection telemetry:** resolving SRV records and cloud provider details moves to the utility.
* **Export to language:** the transpiler evaluates user-entered literals in a Node.js `vm` sandbox, so transpilation moves to the utility.
* **Atlas sign-in:** its one remaining Node.js `crypto` call (a hash) is replaced.

## Polyfills

We can use some of the pollyfills set up for Compass Web: readable-stream, util, events and others that are standard reliable replacements because they are some user-land level implementation of node.js stdlib APIs.

## Enforcement

A webpack plugin reports every Node.js builtin that the renderer bundle imports, grouped by the chain of imports that brought it in, and reports imports inside a try/catch separately. It warns today. When the count reaches zero it becomes an error, so a regression fails the build.

## Enabling the Flags

Each flag can be switched once its prerequisites land, and Compass stays shippable between steps.

1. **nodeIntegration: false** \- no `electron`, `@electron/remote`, or Node.js builtins in the renderer that execute when a module loads, and no loading modules from disk at run time
2. **nodeIntegrationInWorker: false** \- the shell runs in a utility process
3. **contextIsolation: true** \- the renderer reaches Electron only through what the preload script exposes
4. **enableRemoteModule: false** \- dialogs and app details come from Main

# Milestone Breakdown

## Work Items

* Some type clean up of DataService, in order to make review easier on the eyes
  * Take complex inlined types and name them and move them to [types.ts](http://types.ts)
  * Change methods where the return type is never used to void
  * Move DataServiceImpl to its own file; since we have to import the interface to the renderer and to DataServiceImpl and they have to live in separate files since one does not get bundled
* Implement RPC utilities and framework
* Implement DataServiceRenderer
  * One method at a time, convert the business logic to an RPC call that goes to the DataServiceImpl running in the utility process
  * BSON, AbortSignal, events, and the OIDC callback
  * `analyzeSchema`, `exportToFile`, `gatherFields`
* Import and export
  * Import APIs on DataService, the `importProgress` event, and the error log in the utility
* Assistant tool calls
  * `listDatabaseTools` and `performToolCall`; the MCP server and its connection in the utility
* Embedded shell
  * Changes to `@mongosh/node-runtime-worker-thread`, the runtime in a utility process, and its lifecycle messages
* hadron-ipc
  * Pull the IPC helpers out of DataService, open a port between the renderer and Main, and move each hadron-ipc caller and Main handler onto them
* Electron APIs in the renderer
  * `webFrame` and `webUtils` through contextBridge, dialogs and app details from Main; remove `@electron/remote`
* Logging
  * The log line global in the preload script, and formatting log lines in the renderer
* User data and preferences
  * An `IUserData` implementation that calls Main, preferences on top of it, and connection import and export through Main
* Other renderer Node.js usage
  * Connection telemetry, export to language, Atlas sign-in
* Build
  * Browser resolution, the three polyfills, no externals, and the stdlib report as an error
* Switch the flags, in the order above

# Complexity Estimate

# Test Plan

# Release Plan

# Assumptions / Risks

* The shell and the assistant tools keep their own driver connections, separate from DataService's. This design moves that duplication into the utility; it does not remove it.
* Only the first AbortSignal in a call's arguments is connected to cancellation. No DataService API takes more than one today.
* The stdlib report sees imports, not globals. Code that relies on `Buffer`, `process`, or `global` being defined will only fail at run time once nodeIntegration is off.
* The CSV type definitions are duplicated between data-service and compass-import-export until import moves.
* Using packages' browser builds changes which code runs for every package that ships one, not only the packages we are targeting.
* Startup calls to Main rely on the port holding messages until Main starts listening. The web platform guarantees this for MessagePort; it needs confirming for Electron's MessagePortMain.

# Q\&A

* Should the shell and the assistant tools share DataService's utility process, or each have their own? Their own isolates crashes and memory use. Sharing lets them read connection options without another round trip.
* Should the shell and the assistant tools use DataService's connection rather than opening their own?

# Alternatives

* IPC:
  * Using the driver's `raw` option has a number of issues [RAW\_OPTION\_FINDINGS.md](https://docs.google.com/document/u/0/d/1ZxV2bRO35rQbxn_ZtqM3fWLKpzE6Snmr3U6KQrTykmg/edit) a handful of methods crash or stop working correctly. There's no mirrored API that allows for inserting or using BSON bytes as a query document.
  * Using a key with a NUL byte is a clever way to get a marker on to an object that makes it distinguishable from a plain BSON document, since BSON documents cannot be keyed by any strings with a NUL byte. However, the instance equality approach allows us to avoid marking and unmarking all the data.
  * RPC the driver rather than DataService: mirror MongoClient, Db, Collection, and cursors over IPC. Rejected because the surface is much larger and cursor lifecycles would have to cross the boundary.
  * postmsg-rpc, which the shell runtime already uses, for DataService. Rejected in favour of a small request-id map: it pulls in a deprecated dependency and its message framing is meant for sharing a channel with unrelated traffic, which a dedicated port does not need.
* Renderer to Main:
  * Expose `ipcRenderer` to the renderer as a whole. Works only without context isolation, since contextBridge does not copy prototype methods, and Electron advises against it for security.
  * Rebuild hadron-ipc on a narrow contextBridge API (send, invoke, subscribe). Its callers would not change, but Compass would keep two IPC mechanisms, it still would not work on compass-web, and it would need its own handling of BSON, AbortSignals and errors, which the DataService helpers already have.
  * Logging through a utility process and postMessage. Rejected because Main already owns the log writer, and a utility process would add a process only to pass strings along.
  * A general file system API over contextBridge for user data. Rejected because it would give the renderer back the file access this project removes; `IUserData` already defines everything the renderer needs.
* Polyfills:
  * Polyfill Node.js broadly, as compass-web does. Not viable for desktop: compass-web can stub most of Node.js because it drops features that desktop must keep, such as most authentication mechanisms, SSH and SOCKS proxies, CSFLE, and file-based TLS.

# References

* Technical Design: Fact Finding
* [Electron: Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
* [Electron: contextBridge](https://www.electronjs.org/docs/latest/api/context-bridge)
* [Electron: utilityProcess](https://www.electronjs.org/docs/latest/api/utility-process)
* Proof of concept: branch `data-service-split`
