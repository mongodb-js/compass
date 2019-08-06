/* eslint-disable react/sort-comp */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import L from 'leaflet';

import { Map, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css'; // Re-uses images from ~leaflet package
import 'leaflet-defaulticon-compatibility';

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
 * Transforms an array `[lat,long]` coordinates into a GeoJSON Point.
 * @param {Array} value `[long, lat]`
 * @returns {Object}
 */
const valueToGeoPoint = value => {
  const [ lat, long ] = [+value[0], +value[1]];
  const point = {
    type: 'Point',
    coordinates: [long, lat],
    center: [long, lat],
    color: UNSELECTED_COLOR,
    /**
     * Passed to `<CustomPopup />`
     */
    fields: [
      {
        key: '[longitude, latitude]',
        value: `[${[long, lat].toString()}]`
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
    const { type: { values } } = this.props;
    let bounds = L.latLngBounds();

    if (values.length === 1) {
      bounds = L.latLng(+values[0][1], +values[0][0]).toBounds(800);
    } else {
      values.forEach((v) => {
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
    const { type: { values }, fieldName } = this.props;

    const geopoints = values.map(value => {
      const v = valueToGeoPoint(value);
      v.fields[0].key = fieldName;
      return v;
    });

    return <GeoscatterMapItem data={geopoints} />;
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
        viewport={{center: [0, 0], zoom: 1}}
        whenReady={this.whenMapReady}
        ref="map"
        onMoveend={this.onMoveEnd}
      >
        {this.renderMapItems()}
        <TileLayer url={DEFAULT_TILE_URL} attribution={attributionMessage} />
      </Map>
    );
  }
}

export default CoordinatesMinichart;
export { CoordinatesMinichart };
