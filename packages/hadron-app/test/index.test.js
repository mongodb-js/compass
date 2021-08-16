const fs = require('fs');
const path = require('path');
const app = require('../');
const expect = require('chai').expect;

describe('hadron-app', function() {
  describe('extend', function() {
    it('should be extenable', function() {
      app.extend({foo: 'bar'});
      expect(app).to.have.property('foo', 'bar');
    });
    it('should have peer deps as dev deps', function() {
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'));
      Object.keys(packageJson.peerDependencies).forEach(dep => {
        expect(packageJson.devDependencies[dep]).to.be.a.string;
      });
    });
  });
});
