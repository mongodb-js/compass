# Google Analytics

Google Analytics supports a number of different [hit types][ga-hittypes] at
the top level. For Compass, we should use `screenview`, `event`, `timing` and
`exception` hit types depending on the event.

The most generic hit type is `event`, which has a similar notion of resources
and actions. Here, `eventCategory` is the resource, and `eventAction` is the
action.

Router `page` events should send `screenview` hits.

Errors and unhandled Exceptions should send `exception` hits.

Performance measurements like schema sampling should use `timing` hits.

## Screen Views

See [App/Screen Views][ga-screenviews] docs.

All `page` tracking events emitted by Compass' `app.router` are transformed
into Google Analytics `screenview` hits.

The following fields are supported with a `screenview` hit:

- `screenName` {String}  (required) use one of `connect`, `schema`, `help`, `preferences`, `tour`
- `appName` {String}  (required) fixed to `MongoDB Compass`
- `appVersion` {String} use current app version, e.g. `1.0.0`
- `appId` {String} _unused_
- `appInstallerVersion` {String} _unused_

## Exceptions

See [Exception Tracking][ga-exceptions] docs.

All tracking events that contain an Error object are transformed into Google
Analytics 'exception' hits.

The following optional fields are supported with an `exception` hit:
- `exDescription`	{String}  use exception message
- `exFatal` {Boolean}


## User Timings

See [User Timings][ga-timings] docs.

The following fields are supported with a `timing` hit:

- `timingCategory` {String} (required) e.g. `Schema`
- `timingVar` {String} (required) e.g. `total_sample_time`
- `timingValue` {Number} (required) time in milliseconds
- `timingLabel` {String}  optional label _unused_


## Events

See [Event Tracking][ga-events] docs.

All events that are not Errors or Pageviews use the generic 'event' hit type.

Google Analytics does not support arbitrary metadata objects. Instead, each 'event' hit consists of

Category {String}
Action {String}
Label (optional, but recommended) {String}
Value (optional) {Number}

To map the above Compass event names to the Google Analytics events, the Category is the first item before the underscore, and the action is the second item, e.g. connection_succeeded has a category of "connection" and an action "succeeded".

There are several ways of submitting additional (meta) information.

we could encode information as Label/Value pairs and send with the event. The values are limited to numeric types.
we could use custom metrics/dimensions and send with the event. metrics and dimensions are limited to 20 distinct values each.

## Additional parameters

For additional variables that can be sent, see the [Measurement Protocol][ga-measurement-protocol];

Here some of the relevant ones:

- `ds` Data Source, set to `app`
- `cid` Client ID, set to the user uuid
- `sc` Session Control, set to `start` when session start and `"end"` when it ends.
- `sr` Screen Resolution, e.g. `800x600`
- `vp` Viewport Size, e.g. `123x456` (use the window size here)




[ga-hittypes]: https://developers.google.com/analytics/devguides/collection/analyticsjs/sending-hits
[ga-screenviews]: https://developers.google.com/analytics/devguides/collection/analyticsjs/screens
[ga-exceptions]: https://developers.google.com/analytics/devguides/collection/analyticsjs/exceptions
[ga-events]: https://developers.google.com/analytics/devguides/collection/analyticsjs/events
[ga-timings]: https://developers.google.com/analytics/devguides/collection/analyticsjs/user-timings
[ga-measurement-protocol]: https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
