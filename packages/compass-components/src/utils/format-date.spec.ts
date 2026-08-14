import { expect } from 'chai';
import {
  convertFromPickerDateTime,
  convertToPickerDateTime,
} from './format-date';

describe('format-date', function () {
  context('convertToPickerDateTime', function () {
    const usecases = [
      {
        title: 'converts an ISO string with a Z timezone',
        input: '2024-06-05T12:34:56.789Z',
        expected: '2024-06-05T12:34:56.789',
      },
      {
        title: 'converts an ISO string with an offset timezone',
        input: '2024-06-05T12:34:56.789+02:00',
        expected: '2024-06-05T10:34:56.789',
      },
      {
        title: 'pads a value without milliseconds',
        input: '2024-06-05T12:34:56Z',
        expected: '2024-06-05T12:34:56.000',
      },
      {
        title: 'converts a date-only value',
        input: '2024-06-05',
        expected: '2024-06-05T00:00:00.000',
      },
      {
        title: 'handles dates before the epoch',
        input: '1969-07-20T20:17:40.000Z',
        expected: '1969-07-20T20:17:40.000',
      },
      {
        title: 'returns an empty string for an invalid date',
        input: 'not a date',
        expected: '',
      },
      {
        title: 'returns an empty string for an empty value',
        input: '',
        expected: '',
      },
    ];
    for (const { title, input, expected } of usecases) {
      it(title, function () {
        expect(convertToPickerDateTime(input)).to.equal(expected);
      });
    }
  });

  context('convertFromPickerDateTime', function () {
    const usecases = [
      {
        title: 'converts a picker value with milliseconds',
        input: '2024-06-05T12:34:56.789',
        expected: '2024-06-05T12:34:56.789+00:00',
      },
      {
        title: 'converts a picker value without milliseconds',
        input: '2024-06-05T12:34:56',
        expected: '2024-06-05T12:34:56.000+00:00',
      },
      {
        title: 'converts a picker value without seconds',
        input: '2024-06-05T12:34',
        expected: '2024-06-05T12:34:00.000+00:00',
      },
      {
        title: 'returns the original value for an invalid date',
        input: 'not a date',
        expected: 'not a date',
      },
      {
        title: 'returns the original value for an empty value',
        input: '',
        expected: '',
      },
    ];
    for (const { title, input, expected } of usecases) {
      it(title, function () {
        expect(convertFromPickerDateTime(input)).to.equal(expected);
      });
    }
  });
});
