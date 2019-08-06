/* eslint-disable prefer-const */
import L from 'leaflet';

import { COPYRIGHT_URL } from './constants';

let fetch = require('node-fetch');

/**
 * Fetches attribution objects from the attribution endpoint (currently the raw API).
 * @returns {Array} Array of attribution objects { label, alt, boxes, minLevel, maxLevel }
 */
export async function _getHereTileBoxes() {
  const rawTileBoxes = await fetch(COPYRIGHT_URL).then(response =>
    response.json()
  );
  return rawTileBoxes.normal.map(attr => ({
    ...attr,
    boxes: attr.boxes.map(box =>
      L.latLngBounds(L.latLng(box[0], box[1]), L.latLng(box[2], box[3]))
    ),
  }));
}

function cachedGetHereTileBoxes() {
  let cache = undefined;
  return async function() {
    if (!cache) {
      cache = await _getHereTileBoxes();
    }
    return cache;
  };
}

let getHereTileBoxes = cachedGetHereTileBoxes();

const getHereAttributionMessage = async function(bounds, level) {
  const tileBoxes = await getHereTileBoxes();
  const copyrights = [];
  tileBoxes.forEach(attribution => {
    const overlaps = attribution.boxes.some(b => bounds.intersects(b));

    if (
      overlaps > 0 &&
      level > attribution.minLevel &&
      level < attribution.maxLevel
    ) {
      copyrights.push(attribution.label);
    }
  });

  const copyrightString = copyrights.join(', ');
  return ` &copy; 1987-2019 HERE${
    copyrightString.length > 0 ? `, ${copyrightString}` : ''
  } | <a href="https://legal.here.com/en/terms/serviceterms/us">Terms of Use</a>`;
};

export { getHereTileBoxes, getHereAttributionMessage };
