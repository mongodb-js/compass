import type { SeedDatabase } from '../../types/seed-data';
import { sampleMflix } from './sample-mflix';
import { sampleAirbnb } from './sample-airbnb';
import { sampleRestaurants } from './sample-restaurants';
import { sampleSupplies } from './sample-supplies';
import { sampleWeatherData } from './sample-weatherdata';

export {
  sampleMflix,
  sampleAirbnb,
  sampleRestaurants,
  sampleSupplies,
  sampleWeatherData,
};

export const seedDatabases: SeedDatabase[] = [
  sampleMflix,
  sampleAirbnb,
  sampleRestaurants,
  sampleSupplies,
  sampleWeatherData,
];
