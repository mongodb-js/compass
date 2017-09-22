/* eslint no-unused-expressions: 0 */
const expect = require('chai').expect;
const mock = require('mock-require');
let { LOADING_STATE } = require('../../src/internal-plugins/sidebar/lib/constants');
let { SidebarStore } = require('../../src/internal-plugins/sidebar/lib/stores');

describe('SidebarStore', function() {
  let unsubscribe;

  beforeEach(() => {
    unsubscribe = () => {};
    SidebarStore = mock.reRequire('../../src/internal-plugins/sidebar/lib/stores');
  });

  afterEach(() => {
    unsubscribe();
  });

  it('_filterdatabases returns for null, i.e. loading state', () => {
    const result = SidebarStore._filterDatabases('', LOADING_STATE);
    expect(result.length).to.be.equal(0);
  });

  it('_filterdatabases returns for an empty array', () => {
    // Also should work with a DatabaseModel instance,
    // but that's not causing the error
    const result = SidebarStore._filterDatabases('', []);
    expect(result.length).to.be.equal(0);
  });
});
