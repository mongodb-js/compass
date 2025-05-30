'use strict';
const LIGHTMODE_TILE_URL =
  'https://compass-maps.mongodb.com/compass/maptile/v3/lite.day/{z}/{x}/{y}/512';
const DARKMODE_TILE_URL =
  'https://compass-maps.mongodb.com/compass/maptile/v3/lite.night/{z}/{x}/{y}/512';

// The copyright url for HERE maps, if we're using the default tile url
const COPYRIGHT_URL = 'https://compass-maps.mongodb.com/compass/copyright/v3';

export { LIGHTMODE_TILE_URL, DARKMODE_TILE_URL, COPYRIGHT_URL };
