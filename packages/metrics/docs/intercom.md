# Intercom


## User Model

See [Intercom Users][intercom-users] docs.

Relevant attributes that we need to set on a user object:

- `user_id` {String}
- `signed_up_at` {Timestamp}
- `custom_attributes` {Object}
- `update_last_request_at` {Boolean}  (should this event update the last_request_at variable automatically?)
- `new_session` {Boolean} (set true on on App launch)


## Custom Data

Intercom supports sending two different kinds of custom data: [Custom User Attributes][custom-user-attributes] and
[User Events][user-events].

### Custom User Attributes

Custom user attributes are global to a user ("who is the user"). They can change
over time, but they are a property of the user. They are ideal for  

- Descriptive information about users, such as profile data, region/country,
subscription type, or device data.
- A single value that gets updated such as last active date, follower count,
or a single value that becomes true, such as completing a product tour.

Dates should always end in `_at`, Intercom automatically interprets those as
dates and not numbers.


For Compass, we should track all one-time events to reach out to users who
have or haven't used certain features, like:

- `last_known_version`   (Remind them to upgrade to latest version)
- `opened_tour`
- `opened_preferences`
- `sampled_collection`
- `used_googlemaps`


### User Events

Events describe certain activities users do in the app ("what is the user doing?").
They have a unique identifier and can have meta-data (up to 5 keys) attached to
them. Ideal for

- Activity, such as using a particular feature, or the number of times a feature has been used.
- When data changed, such as when a subscription was changed or the last time an order was placed.
- Data that may only be needed for a period of time, such as initial use of a feature.


#### How Resources and Actions map to Intercom Events

Intercom doesn't have a concept of separate resources and actions in their
event system. Their suggestion is to send events consisting of a verb and
a noun, e.g. `created_cart`. We can combine the resource and action to
create such a key, e.g. `sampled_collection` or `opened_tour`.

Intercom can only receive up to 5 custom metadata keys for each event. Therefore we
need to limit the metadata, or only send the top 5 to intercom.


[custom-user-attributes]: https://docs.intercom.io/configuring-intercom/send-custom-user-attributes-to-intercom
[user-events]: https://docs.intercom.io/intercom-for-user-analysis/tracking-user-events-in-intercom
[intercom-users]: https://doc.intercom.io/api/?javascript#users
