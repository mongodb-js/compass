const app = require('../');
const expect = require('chai').expect;

const babel = require('babel-register');
const appRegistry = require('hadron-app-registry');
const less = require('less');
const dataService = require('mongodb-data-service');
const propTypes = require('prop-types');
const react = require('react');
const reactDOM = require('react-dom');


describe('hadron-app', function() {
  describe('extend', function() {
    it('should be extenable', function() {
      app.extend({foo: 'bar'});
      expect(app).to.have.property('foo', 'bar');
    });
    it('should have peer deps as dev deps', function() {
      expect(babel).to.not.be.null;
      expect(appRegistry).to.not.be.null;
      expect(less).to.not.be.null;
      expect(dataService).to.not.be.null;
      expect(propTypes).to.not.be.null;
      expect(react).to.not.be.null;
      expect(reactDOM).to.not.be.null;
    });
  });
});
