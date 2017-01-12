const expect = require('chai').expect;
const {zoomReset, zoomIn, zoomOut} = require('../../src/app/menu-renderer');

describe('Zoom renderer tests', () => {
  afterEach(() => {
    zoomReset();
  });
  it('should zoom reset', () => {
    expect(zoomReset()).to.be.equal(0);
  });
  it('should zoom in', () => {
    expect(zoomIn()).to.be.equal(0.5);
  });
  it('should zoom in at least 5x', () => {
    [1,2,3,4,5].forEach(() => {zoomIn()});
    expect(zoomIn()).to.be.equal(3);
  });
  it('should zoom out', () => {
    expect(zoomOut()).to.be.equal(-0.5);
  });
  it('should zoom out at least 5x', () => {
    [1,2,3,4,5].forEach(() => {zoomOut()});
    expect(zoomOut()).to.be.equal(-3);
  });
});
