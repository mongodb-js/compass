import { expect } from 'chai';
import { mapFieldToPropertyName, mapFieldsToGroupId } from './utils';

describe('wizard use-case utils', function () {
  context('mapFieldToPropertyName', function () {
    it('replaces periods with underscores', function () {
      expect(mapFieldToPropertyName('address.location.street')).to.equal(
        'address_location_street'
      );
    });

    it('does not modify a field without periods', function () {
      expect(mapFieldToPropertyName('street_name')).to.equal('street_name');
    });
  });

  context('mapFieldsToGroupId', function () {
    it('maps empty fields to null', function () {
      expect(mapFieldsToGroupId([])).to.be.null;
    });

    it('maps fields with one item to a string value', function () {
      expect(mapFieldsToGroupId(['username'])).to.equal('$username');
    });

    it('maps fields with multiple items to an object value', function () {
      expect(mapFieldsToGroupId(['username', 'email'])).to.deep.equal({
        username: '$username',
        email: '$email',
      });
    });
  });
});
