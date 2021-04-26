import React from 'react';
import PropTypes from 'prop-types';
import { CircleMarker } from 'react-leaflet';

import CustomPopup from './marker-popup';

const DEFAULT_STYLES = {
  weight: 1,
  radius: 5,
  fillOpacity: 0.6
};

// Give a popup to a react-leaflet marker component
// e.g a CircleMarker, Polygon, Polyline, Rectangle
const popupComponent = (ParentComponent, properties) => {
  const props = {
    ...DEFAULT_STYLES,
    ...properties,
  };

  return (
    <ParentComponent
      {...props}
      onMouseOver={e => {
        e.target.openPopup();
      }}
      onMouseOut={e => {
        e.target.closePopup();
      }}
    >
      <CustomPopup {...props} />
    </ParentComponent>
  );
};

popupComponent.propTypes = {
  fields: PropTypes.array,
};

const Marker = ({ data }) =>
  data.map((point, i) => {
    point.key = i;

    return popupComponent(CircleMarker, point);
  });

Marker.propTypes = {
  data: PropTypes.array.isRequired,
};

export default Marker;
export { Marker, popupComponent };
