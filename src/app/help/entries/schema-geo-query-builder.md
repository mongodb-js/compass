---
title: Geo Query Builder
tags:
  - schema
  - geo
  - coordinates
  - query builder
devOnly: true
section: Schema
---
<strong>
Compass displays geo coordinate points on an interactive map and supports
construction of a `$geoWithin` query on the data.
</strong>

<br />
<img src="./images/help/schema/geo-query-builder.png" width=400 />

### Geospatial Data

When Compass finds geospatial data, it translates the latitude and longitude
to coordinate points on an interactive map. Both [legacy coordinate pairs][legacy-coordinates] and
[GeoJSON objects][geojson-objects] are supported.

Example for a document with legacy coordinate pairs:

```js
{
  _id: ObjectId("56fb553676b5a8ce827892b7"),
  last_known_position: [-79.1, 34.5]
}
```

Example for a document with GeoJSON objects:

```js
{
  _id: ObjectId("56fb553676b5a8ce827892b7"),
  last_known_position: {
    type: "Point",
    coordinates: [-79.1, 34.5]
  }
}
```

Visit the MongoDB documentation for more information about [Geospatial Queries and Indexes][geo-documentation].

### Map Controls

To pan the map, press and hold the mouse/trackpad button anywhere on the map and then drag the map to the desired location.

To zoom in and out, use the `+` and `-` buttons from the control panel, or use the scroll wheel (mouse) or "2 finger scroll" (trackpad).

To rotate the map, press and hold the little compass needle from the control panel, then drag the map to the desired orientation. To restore the original map orientation (north at the top), click on the compass needle.

### Geo Query Builder

To construct a [$geoWithin][geo-within-operator] query, hold down the shift key, press and hold the mouse/trackpad button anywhere on the map to place the selection circle center, then drag the mouse to resize the selection circle. Release the mouse button at the desired radius.

The circle moves with the map. If you want to change the location of the circle, drag the small red control circle in the center to the new location. If you want to resize the circle, drag the outer red control circle to the new radius.

If you want to remove the selection, shift-click anywhere on the map.

Any change to the circle will immediately be reflected in the query bar at the top of the screen.

Other geo query operators, like e.g. [$geoIntersects][geo-intersects-operator] or [$nearSphere][near-sphere-operator] are currently not supported.


[geojson-objects]: https://docs.mongodb.org/manual/applications/geospatial-indexes/#geojson-objects
[legacy-coordinates]: https://docs.mongodb.org/manual/applications/geospatial-indexes/#legacy-coordinate-pairs
[geo-documentation]: https://docs.mongodb.org/manual/applications/geospatial-indexes/
[geo-within-operator]: https://docs.mongodb.org/manual/reference/operator/query/geoWithin/
[geo-intersects-operator]: https://docs.mongodb.org/manual/reference/operator/query/geoIntersects/
[near-sphere-operator]: https://docs.mongodb.org/manual/reference/operator/query/nearSphere/
