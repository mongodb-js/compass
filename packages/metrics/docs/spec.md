# Metrics Spec

1. Provide a clean API to describe resources, their actions and attached
metadata.

2. Each resource/action combination can define how it wants to report itself
to any of the trackers.

3. The metrics module should not make any assumptions about the app (don't
access any variables on the app object). The app itself should set up the event
listeners, not the metrics module.

For example, `metrics.track('App', 'launched', {appName: 'MongoDB Compass', appVersion: app.meta['App Version']})` will create a Google Analytics
`screenview` hit providing the app name, version, etc. It will also send an Intercom
user event called `launched_app` with some custom metadata fields like app
version etc. It will not send anything via Bugsnag.

Another example: `metrics.error(err, false)` will send a Google
Analytics `exception` hit, a Bugsnag report, and an Intercom event `uncaught_error`.


## Using Ampersand

_Resources_ are `ampersand-state`s and _actions_ are methods on the state. metadata
is an argument passed into the action. The resource can augment the passed in
metadata with its own properties and derived props, e.g. `user_id`, so that it
doesn't have to be passed in on every call.

```js
var Resource = State.extend({
  props: {
    user_id: 'string',
    session_id: 'string',
    app_name: 'string',
    timestamp: 'date'
  },
  session: {
    app: 'state',
    intercom: 'object',
    googleAnalytics: 'object',
    bugsnag: 'object'
  },
  /**
   * @api private
   */
  _send_ga_event: function(action, label, value) {
    // category is this.namespace, e.g. 'User'
    // maybe use https://www.npmjs.com/package/caller-id to also defer action?
  },
  /**
   * @api private
   */
  _send_ga_screenview: function(screenname) {
  },
  /**
   * @api private
   */
  _send_intercom_event: function(eventName, metadata) {
  }
});

var UserResource = Resource.extend({
  namespace: 'User',
  session: {
    user: 'state'
  },
  derived: {
    user_id: {
      deps: ['user._id'],
      fn: function() {
        return user._id;
      }
    },
    // ...
  }
  /**
   * @api public
   */
  created: function(metadata) {
    // this.serialize() should provide all metadata attributes needed in
    // addition the ones passed into the method.

    // @todo call the desired tracking events
    this._send_ga_event('created');
  },
  /**
   * @api public
   */
  login: function(metadata) {
  }
});

var userResource = new UserResource({
  user: app.user
});
```

The main metrics object keeps a collection of resources and offers some
convenience helper methods. It also provides all resources with access to the
different trackers, so they can use them directly.

```js
var Metrics = State.extend({
  collections: {
    resources: ResourceCollection
  },
  addResource: function(resource, options) {
    resource.intercom = this.intercom;
    resource.googleAnalytics = this.ua;
    resource.bugsnag = this.bugsnag;
    this.resources.add(resource, options);
  },
  /**
   * Call this from your app when it encountered an error.
   * @param  {Error} err         the error encountered
   * @param  {Boolean} wasFatal  true for fatal exceptions
   */
  error: function(err, wasFatal) {
    var resource = this.resources.get('Error');
    var action = 'uncaught';
    var metadata = {
      exception: err.message,
      stack_trace: err.stack,
      fatal: wasFatal
    };
    resource[action](metadata);
  },
  /**
   * Call this from your app when you want to track an event.
   * @param  {String} resourceId      the resource, e.g. `Collection`
   * @param  {String} action          the action, e.g. `sampled`
   * @param  {Object} metadata        metadata associated with that event
   */
  track: function(resourceId, action, metadata) {
    var resource = this.resources.get(resourceId);
    resource[action](metadata);
  }  
});
```
