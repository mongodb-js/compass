import type { Circle, Polygon } from 'leaflet';

const METERS_IN_MILE = 1609.344;
const RADIANS = 3963.2;

/**
 * Calculate radians from meters.
 *
 * @param {Number} meters - The meters.
 *
 * @returns {Number} radians.
 */
const radians = (meters: number): number => {
  return meters / METERS_IN_MILE / RADIANS;
};

export type InternalLayer = InternalCircle | InternalPolygon;
type InternalCircle = {
  field: string;
  lat: number;
  lng: number;
  radius: number;
  type: 'circle';
};
type InternalPolygon = {
  field: string;
  coordinates: [number, number][][];
  type: 'polygon';
};

/**
 * Generate a GeoJSON query for a polygon.
 *
 * @param {Object} layer - The layer.
 *
 * @returns {Object} The query.
 */
const polygon = (layer: InternalPolygon) => ({
  [layer.field]: {
    $geoWithin: {
      $geometry: {
        type: 'Polygon',
        coordinates: layer.coordinates,
      },
    },
  },
});

/**
 * Get a single $centerSphere query.
 *
 * @param {Layer} layer - The Leaflet layer.
 *
 * @returns {Object} The $centerSphere query.
 */
const centerSphere = (layer: InternalCircle) => ({
  [layer.field]: {
    $geoWithin: {
      $centerSphere: [[layer.lng, layer.lat], radians(layer.radius)],
    },
  },
});

/**
 * Get the coordinates for the ring.
 *
 * @param {Array} ring - The ring of coordinates.
 *
 * @returns {Array} The coordinates array.
 */
const coordinates = (
  ring: { lng: number; lat: number }[][]
): [number, number][][] => {
  return ring.map((latlngs) => {
    const coords = latlngs.map(
      (latlng) => [latlng.lng, latlng.lat] as [number, number]
    );
    // Leaflet doesn't close the ring for us.
    coords.push(coords[0]);
    return coords;
  });
};

/**
 * Generate a query for a single layer.
 *
 * @param {Object} layer - The layer.
 *
 * @returns {Object} The query.
 */
const generateSingle = (layer: InternalLayer) => {
  if (layer.type === 'circle') {
    return centerSphere(layer);
  } else if (layer.type === 'polygon') {
    return polygon(layer);
  }
};

/**
 * Generate a $or query for multiple layers.
 *
 * @param {Array} layers - The layers.
 *
 * @returns {Object} The query.
 */
const generateMulti = (layers: InternalLayer[]) => ({
  $or: layers.map((layer) => generateSingle(layer)),
});

/**
 * Generate a geo query for the provided layers.
 *
 * @param {Object} allLayers - All the layers in the map.
 *
 * @returns {Object} The query.
 */
export const generateGeoQuery = (allLayers: Record<string, InternalLayer>) => {
  const layers = Object.values(allLayers);
  if (layers.length === 1) {
    return generateSingle(layers[0]);
  }
  return generateMulti(layers);
};

/**
 * Add a circle layer to the layers object.
 *
 * @param {String} field - The field name.
 * @param {Layer} layer - The layer to add.
 * @param {Object} allLayers - All the layers in the map.
 *
 * @returns {Object} All the layers with the new layer added.
 */
const addCircleLayer = (
  field: string,
  layer: Circle,
  allLayers: Record<string, InternalLayer>
) => {
  const layers = { ...allLayers };
  layers[(layer as any)._leaflet_id] = {
    field: field,
    lat: (layer as any)._latlng.lat,
    lng: (layer as any)._latlng.lng,
    radius: (layer as any)._mRadius,
    type: 'circle',
  };
  return layers;
};

/**
 * Add a polygon layer to the layers object.
 *
 * @param {String} field - The field name.
 * @param {Layer} layer - The layer to add.
 * @param {Object} allLayers - All the layers in the map.
 *
 * @returns {Object} All the layers with the new layer added.
 */
const addPolygonLayer = (
  field: string,
  layer: Polygon,
  allLayers: Record<string, InternalLayer>
) => {
  const layers = { ...allLayers };
  layers[(layer as any)._leaflet_id] = {
    field: field,
    coordinates: coordinates((layer as any)._latlngs),
    type: 'polygon',
  };
  return layers;
};

/**
 * Add a layer to the layers in the map.
 *
 * @param {String} field - The field name.
 * @param {Layer} layer - The new layer.
 * @param {Object} layers - All the existing layers.
 *
 * @returns {Object} The new layers.
 */
export const addLayer = (
  field: string,
  layer: Circle | Polygon,
  layers: Record<string, InternalLayer>
) => {
  if ((layer as any)._latlngs) {
    return addPolygonLayer(field, layer as Polygon, layers);
  } else if ((layer as any)._latlng) {
    return addCircleLayer(field, layer as Circle, layers);
  }
  return layers;
};
