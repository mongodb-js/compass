# mongodb-js-metrics [![travis][travis_img]][travis_url] [![npm][npm_img]][npm_url]
mongodb-js-metrics is a reusable metrics wrapper for a number of external tracking services. Currently, it supports [Google Analytics][ga], [Intercom][intercom], [Mixpanel][mixpanel] and [Bugsnag][bugsnag].

## Quick Start
Here is an example how to set up Google Analytics tracking of application launches, screen views and user logins within your app.

```js
// require the built-in resources and the metrics object itself
var resources = require('mongodb-js-metrics').resources;
var metrics = require('mongodb-js-metrics')(); // note the () at the end

// configure Google Analytics with our tracking id
metrics.configure('ga', {
  trackingId: 'UA-########-#',
  enabled: true
});

// create an app resource with name and version
var app = new resources.AppResource({
  appName: 'My Cool App',
  appVersion: '2.0.1'
});

// create a user resource with client id (UUID v4 recommended)
var user = new resources.UserResource({
  clientId: '3c007a83-e8c3-4b52-9631-b5fd97950dce'
});

// add the resources to the metrics module to set everything up
metrics.addResource(app, user);

// track an application launch event
metrics.track('App', 'launched');

// track a user login event
metrics.track('User', 'login');

// track a screen view of the start screen
metrics.track('App', 'viewed', 'Start Screen');
```

The call to `metrics.track()` is just a convenience wrapper. You could also just call the action on the resource itself (actions are methods on the resource). For example, pass the `user` resource to the code parts that handle user actions, and whenever the user logs in, call:

```js
// assumes you have a reference to the `user` resource above
user.login();

// identical to...
metrics.track('User', 'login');
```

Because `metrics` is a singleton, you don't have to worry about passing it (or the resources) around or polluting your global context. Once the Resources are added in your app setup code, you can always just access another reference:

```js
// in some other file in your project, e.g. the Help Screen
var metrics = require('mongodb-js-metrics')();
metrics.track('App', 'viewed', 'Help Screen');
```

## Details
The metrics module is a singleton. Any new instantiation will return a reference to the existing singleton object.

```js
// note the () at the end, to instantiate the singleton
var metrics = require('mongodb-js-metrics')();
```

The `metrics` object holds references to trackers and resources, and makes the trackers available to the resources. It also contains convenient helper methods to  make tracking very easy.

### Trackers
The current version supports 4 trackers:

##### Google Analytics

Used to send _screen views_, _events_, _errors_, _timings_. Tracker name is `ga`. Requires **App** and **User** resources.

##### Intercom

Used to send _events_ and also provides _in-app communication_. Tracker name is `intercom`. Requires **App** and **User** resources.


##### Mixpanel

Used to send _events_. Tracker name is `mixpanel`. Requires **App** and **User** resources.

##### Bugsnag

Used to send _errors_. Tracker name is `bugsnag`. Requires **App** resource.


#### Configuration
You can configure individual trackers with the `configure(name, options)` syntax. Note the different key names for the keys,
which use each of the tracker's terminology for consistency. Trackers are disabled by default, so don't forget to enable them.

```js
// configure Google Analytics
metrics.configure('ga', {
  trackingId: 'UA-########-#',
  enabled: true
});

// configure Bugsnag
metrics.configure('bugsnag', {
  apiKey: '################################',
  enabled: true
});

// configure Intercom
metrics.configure('intercom', {
  appId: '########',
  enabled: true
});

// configure Mixpanel
metrics.configure('mixpanel', {
  apiToken: '#####################',
  enabled: true
});
```

You can also configure multiple trackers at once, by passing in a single object to the `configure(options)` method. The keys have to match the tracker names:

```js
metrics.configure({
  ga: {
    trackingId: 'UA-########-#',
    enabled: true
  },
  bugsnag: {
    apiKey: '################################',
    enabled: true
  }
});
```

Configuring a tracker automatically enables it. This behavior can be disabled by explicitly passing in `{enabled: false}` into the options for the tracker.

### Resources
Everything you want to track is organized into _resources_ and their _actions_. Each resource/action pair can be reported differently to one or more trackers.

For example, if you want to track application launches, you would create an _App_ resource with a `launched` action. If you want to track different types of errors, you could create an `Error` resource and give it different actions, like `info`, `warning`, `error`.

Resources have access to the trackers, and by default assign their properties to all trackers that require the properties. For example, the _App_ resource has  a property called `appName`. When the resource is added to metrics, it automatically pushes the `appName` value to all trackers that define it as one of their properties.

You need to add resources before you can track anything. The _App_ and _User_ resources are almost always required. Once they are added (see Quick Start for an example), you can use the `metrics.track()` helper to conveniently track events.

The first argument to `track()` is the name of the resource (as a convention, all resources have uppercase names, and all actions have lowercase names). The second argument is the name of the action you want to call. Subsequent arguments are passed to the action method, including a potential `callback` parameter at the end.

```js
metrics.track('User', 'login', { timestamp: new Date(), team: 'Awesome' }, function(err, resp) {
  if (err) {
    // warn and silently ignore if the action couldn't be tracked
    console.warn('could not track user login, because: ', err);
    return;
  }
  // should return status code 200
  console.log('error successfully tracked with status code', resp.statusCode);
});
```

### Built-in Resources
mongodb-js-metrics comes with some commonly used built-in resources already. Those resources and their actions are:
- App
  - `launched()`
  - `quit(exitCode)`
  - `upgraded(previousVersion)`
  - `viewed(screenName)`

- User
  - `created()`
  - `login()`
  - `logout()`

- Error
  - `info(err)`
  - `warning(err)`
  - `error(err)`

- Feature (derive from this for each feature you use)
  - `used(metadata)`

- Host (no tracking action, used for super properties)

Example how to track the usage of a plasma cannon and what strength was used:

```js
var FeatureResource = require('mongodb-js-metrics').resources.FeatureResource;
var metrics = require('mongodb-js-metrics')();

var PlasmaCannon = FeatureResource.extend({
  id: 'Plasma Cannon'
});

metrics.addResource(new PlasmaCannon());

// assumes trackers are configured and `App` and `User` resources added previously
metrics.track('Plasma Cannon', 'used', {
  strength: 19
});
```

### Custom Resources
You can also build custom Resources that are specific to your app and use them as you would use the built-in ones. Make them extend the `BaseResource` and follow its interface. For an example, look at the built-in resources under `./lib/resources/` to see how they are implemented.

## License
Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/metrics.svg
[travis_url]: https://travis-ci.org/mongodb-js/metrics
[npm_img]: https://img.shields.io/npm/v/mongodb-js-metrics.svg
[npm_url]: https://npmjs.org/package/mongodb-js-metrics
[ga]: https://analytics.google.com
[intercom]: https://intercom.io
[bugsnag]: https://bugsnag.com
[mixpanel]: https://mixpanel.com
