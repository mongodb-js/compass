import type { SeedDatabase } from '../../types/seed-data';
import { sampleMflix } from './sample-mflix';
import { sampleAirbnb } from './sample-airbnb';

export { sampleMflix, sampleAirbnb };

export const seedDatabases: SeedDatabase[] = [sampleMflix, sampleAirbnb];
