import { ObjectId } from 'mongodb';
import type { SeedDatabase } from '../../types/seed-data';

const weatherDataDocuments: Record<string, unknown>[] = [
  {
    _id: new ObjectId('5553a998e4b02cf7151190b8'),
    st: 'x+47600-047900',
    ts: new Date('1984-03-05T13:00:00.000Z'),
    position: {
      type: 'Point',
      coordinates: [-47.9, 47.6],
    },
    elevation: 9999,
    callLetters: 'VCSZ',
    qualityControlProcess: 'V020',
    dataSource: '4',
    type: 'FM-13',
    airTemperature: { value: -3.1, quality: '1' },
    dewPoint: { value: 999.9, quality: '9' },
    pressure: { value: 1015.3, quality: '1' },
    wind: {
      direction: { angle: 999, quality: '9' },
      type: '9',
      speed: { rate: 999.9, quality: '9' },
    },
    visibility: {
      distance: { value: 999999, quality: '9' },
      variability: { value: 'N', quality: '9' },
    },
    skyCondition: {
      ceilingHeight: { value: 99999, quality: '9', determination: '9' },
      cavok: 'N',
    },
    sections: ['AG1'],
    precipitationEstimatedObservation: {
      discrepancy: '2',
      estimatedWaterDepth: 999,
    },
  },
  {
    _id: new ObjectId('5553a998e4b02cf7151190b9'),
    st: 'x+45200-066500',
    ts: new Date('1984-03-05T14:00:00.000Z'),
    position: {
      type: 'Point',
      coordinates: [-66.5, 45.2],
    },
    elevation: 9999,
    callLetters: 'VC81',
    qualityControlProcess: 'V020',
    dataSource: '4',
    type: 'FM-13',
    airTemperature: { value: -4.7, quality: '1' },
    dewPoint: { value: 999.9, quality: '9' },
    pressure: { value: 1025.9, quality: '1' },
    wind: {
      direction: { angle: 999, quality: '9' },
      type: '9',
      speed: { rate: 999.9, quality: '9' },
    },
    visibility: {
      distance: { value: 999999, quality: '9' },
      variability: { value: 'N', quality: '9' },
    },
    skyCondition: {
      ceilingHeight: { value: 99999, quality: '9', determination: '9' },
      cavok: 'N',
    },
    sections: ['AG1'],
    precipitationEstimatedObservation: {
      discrepancy: '2',
      estimatedWaterDepth: 999,
    },
  },
  {
    _id: new ObjectId('5553a998e4b02cf7151190ba'),
    st: 'x+40100-074000',
    ts: new Date('1984-03-05T15:00:00.000Z'),
    position: {
      type: 'Point',
      coordinates: [-74.0, 40.1],
    },
    elevation: 15,
    callLetters: 'KNYC',
    qualityControlProcess: 'V020',
    dataSource: '4',
    type: 'FM-13',
    airTemperature: { value: 6.2, quality: '1' },
    dewPoint: { value: 1.3, quality: '1' },
    pressure: { value: 1011.1, quality: '1' },
    wind: {
      direction: { angle: 240, quality: '1' },
      type: 'N',
      speed: { rate: 12.4, quality: '1' },
    },
    visibility: {
      distance: { value: 12000, quality: '1' },
      variability: { value: 'N', quality: '1' },
    },
    skyCondition: {
      ceilingHeight: { value: 2200, quality: '1', determination: '1' },
      cavok: 'N',
    },
    sections: ['AG1', 'MD1'],
    precipitationEstimatedObservation: {
      discrepancy: '0',
      estimatedWaterDepth: 0,
    },
  },
];

export const sampleWeatherData: SeedDatabase = {
  databaseName: 'sample_weatherdata',
  collections: [
    {
      collectionName: 'data',
      documents: weatherDataDocuments,
      indexes: [
        { key: { position: '2dsphere' } },
        { key: { st: 1, ts: 1 } },
        { key: { 'position.coordinates': '2dsphere' } },
        { key: { 'position.coordinates.0': 1, 'position.coordinates.1': 1 } },
        { key: { ts: 1 } },
        { key: { st: 1 } },
      ],
    },
  ],
};
