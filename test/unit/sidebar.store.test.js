/* eslint no-unused-expressions: 0 */
const expect = require('chai').expect;
const mock = require('mock-require');
let { SidebarStore } = require('../../src/internal-packages/sidebar/lib/stores');

describe('SidebarStore', function() {
  let unsubscribe;

  beforeEach(() => {
    unsubscribe = () => {};
    SidebarStore = mock.reRequire('../../src/internal-packages/sidebar/lib/stores');
  });

  afterEach(() => {
    unsubscribe();
  });

  it('_filterdatabases returns for an empty array', () => {
    // Also should work with a DatabaseModel instance,
    // but that's not causing the error
    const result = SidebarStore._filterDatabases('', []);
    expect(result.length).to.be.equal(0);
  });
});
