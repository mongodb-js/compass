const app = require('../');
const expect = require('chai').expect;


describe('hadron-app', function() {
  describe('extend', function() {
    it('should be extenable', function() {
      app.extend({foo: 'bar'});
      expect(app).to.have.property('foo', 'bar');
    });
  });
});
