/* eslint-disable react/sort-comp */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import L from 'leaflet';

import { Map, TileLayer, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css';
import 'leaflet-defaulticon-compatibility';
import './coordinates-minichart.css';

import GeoscatterMapItem from './marker';

import { DEFAULT_TILE_URL } from './constants';
import { getHereAttributionMessage } from './utils';
import debounce from 'lodash.debounce';

// TODO: Disable boxZoom handler for circle lasso.
//
// const SELECTED_COLOR = '#F68A1E';
const UNSELECTED_COLOR = '#43B1E5';
// const CONTROL_COLOR = '#ed271c';

/**
 * Fetches the tiles from the compass maps-proxy
 * and attaches the attribution message to the
 * map.
 * @param {react-leaflet.Map} map The rendered component ref.
 */
const attachAttribution = async function(map) {
  let attributionMessage = '';
  if (map) {
    const bounds = map.leafletElement.getBounds();
    const level = map.leafletElement.getZoom();

    attributionMessage = await getHereAttributionMessage(bounds, level);
  }
  return attributionMessage;
};

/**
 * @example
 * var doc = {
 *   _id: ObjectId('5c8c1f86db2e914acc6e8a17'),
 *   'Start Time': '',
 *   'End Time': null,
 *   Name: null,
 *   Latitude: null,
 *   Longitude: null,
 *   Service: null,
 *   Coordinates: [NaN, NaN]
 * };
 * isValidLatLng(doc.Coordinates) // [NaN, NaN];
 * > false
 * @param {Array<Double>} value
 * @returns {Boolean}
 */
const isValidLatLng = value => {
  if (isNaN(+value[0]) || isNaN(+value[1])) {
    // eslint-disable-next-line no-console
    console.warn('@mongodb-js/compass-schema:coordinates-minichart: Dropping invalid coordinate value', value);
    return false;
  }

  return true;
};

/**
 * Transforms an array `[lat,long]` coordinates into a GeoJSON Point.
 * @param {Array} value `[long, lat]`
 * @returns {Object}
 */
const valueToGeoPoint = value => {
  const [lat, lng] = [+value[0], +value[1]];

  const point = {
    type: 'Point',
    coordinates: [lng, lat],
    center: [lng, lat],
    color: UNSELECTED_COLOR,
    /**
     * Passed to `<CustomPopup />`
     */
    fields: [
      {
        key: '[longitude, latitude]',
        value: `[${[lng, lat].toString()}]`
      }
    ]
  };
  return point;
};

/**
 * Example `type` prop:
 *
 * ```
 * {
 *   name: 'Boolean',
 *   count: 1,
 *   probability: 0.25,
 *   unique: 1,
 *   values: [true]
 * }
 * ```
 */

// From charts geospatial map-item

class CoordinatesMinichart extends PureComponent {
  static displayName = 'CoorddinatesMinichart';
  static propTypes = {
    _id: PropTypes.string,
    type: PropTypes.shape({
      name: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired,
      probability: PropTypes.number.isRequired,
      unique: PropTypes.number,
      values: PropTypes.array
    }),
    width: PropTypes.number.isRequired,
    actions: PropTypes.object.isRequired,
    height: PropTypes.number.isRequired,
    fieldName: PropTypes.string.isRequired
  };

  state = {
    ready: false,
    attributionMessage: ''
  };

  /**
   * Sets a map view that contains the given geographical bounds
   * with the maximum zoom level possible.
   */
  fitMapBounds() {
    const { map } = this.refs;
    if (!map) {
      return;
    }
    const leaflet = this.refs.map.leafletElement;

    const values = this.props.type.values.filter(isValidLatLng);

    let bounds = L.latLngBounds();

    if (values.length === 1) {
      bounds = L.latLng(+values[0][1], +values[0][0]).toBounds(800);
    } else {
      values.forEach(v => {
        bounds.extend(L.latLng(+v[1], +v[0]));
      });
    }
    leaflet.fitBounds(bounds);
  }

  componentDidUpdate() {
    this.fitMapBounds();
    this.invalidateMapSize();
  }

  whenMapReady = () => {
    if (this.state.ready) {
      return;
    }

    this.getTileAttribution();
    this.setState({ ready: true }, this.invalidateMapSize);
  };

  async getTileAttribution() {
    if (this.state.attributionMessage !== '') {
      return;
    }

    const { map } = this.refs;
    const attributionMessage = await attachAttribution(map);
    this.setState({ attributionMessage });
  }

  invalidateMapSize() {
    const { map } = this.refs;
    if (!map) {
      return;
    }

    map.container.style.height = `${this.props.height}px`;
    map.container.style.width = `${this.props.width}px`;
    map.leafletElement.invalidateSize();
  }

  onMoveEnd = debounce(() => {
    this.getTileAttribution();
  });

  /**
   * Render child markers for each value in this field type.
   *
   * @returns {react.Component}
   */
  renderMapItems() {
    console.log('props', this.props);
    const {
      fieldName
    } = this.props;

    const values = this.props.type.values.filter(isValidLatLng);

    const geopoints = values
      .map(value => {
        const v = valueToGeoPoint(value);
        v.fields[0].key = fieldName;
        return v;
      });

    return <GeoscatterMapItem data={geopoints} />;
  }

  onCreated = (evt) => {
    this.props.actions.geoLayerAdded(this.props.fieldName, evt.layer);
  }

  onEdited = (evt) => {
    this.props.actions.geoLayersEdited(this.props.fieldName, evt.layers);
  }

  onDeleted = (evt) => {
    this.props.actions.geoLayersDeleted(evt.layers);
  }

  /**
   * Values plotted to a leaftlet.js map with attribution
   * to our current map provider, HERE.
   * @returns {React.Component}
   */
  render() {
    const { attributionMessage } = this.state;
    return (
      <Map
        minZoom={1}
        viewport={{ center: [0, 0], zoom: 1 }}
        whenReady={this.whenMapReady}
        ref="map"
        onMoveend={this.onMoveEnd}>
        {this.renderMapItems()}
        <TileLayer url={DEFAULT_TILE_URL} attribution={attributionMessage} />
        <FeatureGroup>
          <EditControl
            position="topright"
            onEdited={this.onEdited}
            onCreated={this.onCreated}
            onDeleted={this.onDeleted}
            onMounted={this.onMounted}
            onEditStop={this.onEditStop}
            onDeleteStop={this.onDeleteStop}
            draw={{
              rectangle: false,
              polyline: false,
              marker: false,
              circlemarker: false
            }}
          />
        </FeatureGroup>
      </Map>
    );
  }
}

export default CoordinatesMinichart;
export { CoordinatesMinichart };
