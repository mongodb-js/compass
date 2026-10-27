import number from './number';
import boolean from './boolean';
import date from './date';
import string from './string';

export default {
  number,
  boolean,
  date,
  string,
  objectid: date, // ObjectIds are charted by their timestamp
};
