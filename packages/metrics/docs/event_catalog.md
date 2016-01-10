# Event Catalog
An event consists of
1. resource
2. action
3. metadata

These attributes form a transparent abstraction and map differently to trackers like Intercom, Google Analytics or Bugsnag.

This document lists useful generic events and specific ones just for Compass, grouped by their resource and action, and specifies the metadata that ideally should be sent for the event.

## General Resources
### `App` Resource
Always send
- [x] `an` app name
- [x] `av` app version

#### Properties
- [x] `appName` {String} e.g. `"MongoDB Compass"`
- [x] `appVersion` {String} e.g. `"1.0.0"`
- [ ] `os` {String} e.g. `"OS X 10.11 (El Capitan)"`

#### Actions
##### `launched()`
Google Analytics : sends an `event` hit with
- [x] `ec` (event category `"App"`)
- [x] `ea` (event action `"launched"`)
- [x] `el` (event label, e.g. `"MongoDB Compass 1.0.0"`)

##### `quit(exitCode)`
Google Analytics : sends an `event` hit with
- [x] `ec` (event category `"App"`)
- [x] `ea` (event action, `"quit"`)
- [x] `el` (event label, e.g. `"MongoDB Compass 1.0.0"`)
- [x] `ev` (event value, return exit code, `0` for expected exit)

##### `upgraded(previousVersion)`
Google Analytics : sends an `event` hit with
- [x] `ec` (event category `"App"`)
- [x] `ea` (event action `"upgraded"`)
- [x] `el` (event label `"MongoDB Compass 1.0.0 -> 1.0.3"`)

##### `viewed(screenName)`
Google Analytics : sends a `screenview` hit with
- `appId` (`"com.mongodb.compass"`)
- `appVersion` (`"1.0.0"`)
- `screenName` (`"Preferences"`)

### `User` Resource
#### Properties
- `userId` {String}

#### Actions
##### `created` Action
##### `logged_in` Action
### `Error` Resource
#### `uncaught` Action
- `exception` {String}
- `stack_trace` {String}
- `fatal` {Boolean}

### `Window` Resource
#### `opened` Action
- `window_name` {String}

#### `closed` Action
- `window_name` {String}

### `Dev Console` Resource
#### `opened` Action
- `window_name` {String}

#### `closed` Action
- `window_name` {String}

## Connect Window Events
### `Clipboard` Resource
#### `detected` Action
#### `used` Action
### `Connection` Resource
#### `failed` Action
- `id` {String}
- `reason` {String}

#### `succeeded` Action
- `id` {String}
- `authentication` {String} (one of "NONE", "MONGODB", "KERBEROS", "LDAP", "X509")
- `ssl` {String} (one of "NONE", "UNVALIDATED", "SERVER", "ALL")
- `mongodb_version` {String}
- `mongodb_topology` {String}
- `enterprise_module` {Boolean}
- `connection_type` {String}  (one of "new", "favorite", "recent", "clipboard")
- `num_dbs` {Number}
- `num_collections` {Number}

## Help Window Events
### `Help` Resource
#### `loaded` Action
- `entry_id` {String}

## Schema Window Events
### `Collection` Resource
#### `sampled` Action
- `duration` {Number}
- `document_count` {Number}
- `total_size` {Number}
- `average_document_size` {Number}
- `num_indexes` {Number}
- `sample_size` {Number}
- `errored_document_count` {Number}
- `total_sample_time` {Number}
- `total_analysis_time` {Number}

### `Query` Resource
#### `refined`
- `num_clauses` {Number}
- `max_depth` {Number}
- `reset` {Boolean}

### `Sharing` Resource
#### `schema` Action
- `size` {Number}

### `Documents` Resource
#### `opened` Action
#### `closed` Action
### `Tour` Resource
#### `opened` Action
- `first_run` {Boolean}

#### `closed` Action
### `Preferences` Resource
#### `opened` Action
- `first_run` {Boolean}

#### `closed` Action
### `Feedback` Resource
#### `opened` Action
#### `sent` Action
#### `received` Action
#### `closed` Action
