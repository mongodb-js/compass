import _ from 'lodash';
import L from 'leaflet';

import { COPYRIGHT_URL } from './constants';

const thisYear = new Date().getFullYear();

/**
 * Fetches attribution objects from the attribution endpoint (currently the raw API).
 * @returns {Array} Array of attribution objects { label, alt, boxes, minLevel, maxLevel }
 */
export async function _getHereTileBoxes() {
  const copyrightData = await fetch(COPYRIGHT_URL).then((response) =>
    response.json()
  );
  const fields = copyrightData.resources.base.styles['lite.day'];
  const tileBoxes = Object.values(_.pick(copyrightData.copyrights, fields))
    .flat()
    .map((notice) => ({
      alt: notice.copyrightText,
      label: notice.label,
      maxLevel: notice.maxLevel,
      minLevel: notice.minLevel,
      boxes: notice.boundingBoxes.map((box) =>
        L.latLngBounds(
          L.latLng(box.south, box.west),
          L.latLng(box.north, box.east)
        )
      ),
    }));
  return tileBoxes;
}

function cachedGetHereTileBoxes() {
  let cache = undefined;
  return async function () {
    if (!cache) {
      cache = await _getHereTileBoxes();
    }
    return cache;
  };
}

let getHereTileBoxes = cachedGetHereTileBoxes();

const getHereAttributionMessage = async function (bounds, level) {
  const tileBoxes = await getHereTileBoxes();
  const copyrights = [];

  tileBoxes.forEach((attribution) => {
    const overlaps = attribution.boxes.some((b) => bounds.intersects(b));

    if (
      overlaps > 0 &&
      level > attribution.minLevel &&
      level < attribution.maxLevel
    ) {
      copyrights.push(attribution.label);
    }
  });

  const copyrightString = copyrights.join(', ');
  return ` <a target="_blank" href="https://leafletjs.com/">Leaflet</a> | &copy; 1987-${thisYear} HERE${
    copyrightString.length > 0 ? `, ${copyrightString}` : ''
  } | <a target="_blank" href="https://legal.here.com/en/terms/serviceterms/us">Terms of Use</a>`;
};

export { getHereTileBoxes, getHereAttributionMessage };
