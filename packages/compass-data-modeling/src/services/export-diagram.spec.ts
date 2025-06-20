import { expect } from 'chai';
import { getExportJsonFromModel } from './export-diagram';
import FlightModel from '../../test/fixtures/flights-model.json';

describe('export-diagram', function () {
  context('json export', function () {
    it('should convert a model to JSON', function () {
      const json = getExportJsonFromModel(FlightModel as any);

      const expectedCollections = Object.fromEntries(
        FlightModel.collections
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .map(({ displayPosition, indexes, ...rest }) => [rest.ns, rest])
      );
      expect(json.collections).to.deep.equal(expectedCollections);

      expect(json.relationships.length).to.equal(
        FlightModel.relationships.length
      );
    });
  });
});
