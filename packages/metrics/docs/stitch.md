# Tracking Metrics with Stitch

[MongoDB Stitch](https://stitch.mongodb.com/) is a backend as a service. Together with MongoDB's hosted cloud services [MongoDB Atlas](https://cloud.mongodb.com), it is very easy to set up your own metrics server.

### Overview

Metrics tracking with Stitch deals with two types of resources: users and events. They are stored in two different collections, with namespaces `metrics.users` and `metrics.events` by default.

##### Users

Users are identified through a unique identifier, stored as `_id`. Your application needs to ensure that user is assigned a unique key the first time they visit your website or start your application. On subsequent visits or app launches, this UUID needs to be retained (via cookies, local storage, fetched from disk, etc). Additional information related to this user can be attached to this unique identifier, for example the user's email address, or other details.

The users schema is as shown in this example:

```json
{
  "_id": "3c007a83-e8c3-4b52-9631-b5fd97950dce",
  "last_login": {"$date": "2017-08-17T06:27:22.251Z"},
  "app_name": "My Cool App",
  "app_version": "2.0.1",
  "host_arch": "x64",
  "host_cpu_cores": 8,
  "host_cpu_freq_mhz": 2900,
  "host_total_memory_gb": 16,
  "host_free_memory_gb": 1.0611343383789062,
  "stitch_user_id": "5995374b05842951d8da03f6",
  "created_at": {"$date":"2017-08-17T06:23:49.662Z"}
}
```

The `created_at` field indicates the first time the user was seen, and will only be set on first creation of the user document. All other fields can be mutated with subsequent updates.

##### Events

Events are tracked in a separate collection `metrics.events`, and the documents are immutable. The schema for the events collection is as follows:

```json
{
  "_id": "fe61cda3-9865-4fff-acba-8de13bc71a24",
  "resource": "App",
  "action": "launched",
  "user_id": "3c007a83-e8c3-4b52-9631-b5fd97950dce",
  "created_at": {"$date":"2017-08-17T06:20:34.232Z"},
  "metadata": {
    "name": "My Cool App",
    "version": "2.0.1",
    "os_name": "macOS Sierra"
  },
  "stitch_user_id":"599535b305842951d8da01fb"
}
```

The `user_id` field corresponds to the `_id` field in the users collection. Each event
can have a metadata subdocument with information specific to the resource and action.


### Requirements

Before you can use the `stitch` tracker from this package, you need to create a [MongoDB Atlas](https://cloud.mongodb.com) account, set up a cluster (Free Tier available), connect a Stitch application and configure it.

### Stitch Configuration

Once you're in your Stitch console, click on `mongodb-atlas` under _Atlas Clusters_. Under _Rules_, create 2 new collections, one for users and one for events tracking. The default namespaces are `metrics.users` and `metrics.events`, but you can use custom database and collection names as well.

*Users Collection*

1. Click on your _users_ collection, and go to _Field Rules_. Select _Top-Level Document_. Ensure that all 3 boxes - Read, Write and Valid - are completely empty.
2. Add a new field (_+ Add_ button) called `_id`. Configure the Read rule as below:

    **Read**
    ```json
    {
      "%%true": true
    }
    ```
    **Write**
    ```json
    {
      "%%true": true
    }
    ```
    This rule ensures that the `_id` field can be read (so that updates succeed) and written to (on first creation of the document). Leave the Valid box empty.
3. Click on _all other fields_, and enable the switch. Configure the Read and Write rules for _all other fields_ as below:

    **Read**
    ```json
    {
      "%%true": false
    }
    ```
    **Write**
    ```json
    {
      "%%true": true
    }
    ```
    These rules ensure that all other fields can never be read through the Stitch API, but can be written to.


*Events Collection*

1. Click on your _events_ collection, and go to _Field Rules_. Select _Top-Level Document_. Configure the Read rule as below:

    **Read**
    ```json
    {
      "%%true": false
    }
    ```
    This ensures that no document of this collection can be read through the Stitch API. This collection is write-only. Leave the Write and Valid boxes empty.

2. Click on _all other fields_, and enable the switch. Configure the Write rule for _all other fields_ as below:

    **Write**
    ```json
    {
      "%%prev": {
        "%exists": false
      }
    }
    ```
    This ensures that all other fields can only be created, but never updated. We don't allow changes to tracked events through the Stitch API.

Your Stitch Application is now configured and ready for tracking metrics. All you need is the App ID (Click on _Clients_ in the sidebar to see it), and the namespaces of the users and events collections, if you chose non-default names.


### Tracker Configuration

The stitch tracker can be configured via `metrics.configure()`. Here is an example:

```js
// configure Stitch
metrics.configure('stitch', {
  appId: 'my-app-metrics-vlgxs',
  users: 'metrics-db.users-coll',     // optional, default is metrics.users
  events: 'metrics-db.events-coll',   // optional, default is metrics.events
  enabled: true
});
```

A code example to configure a stitch tracker and send some metrics can be found in [`../examples/stitch.js`](../examples/stitch.js).
