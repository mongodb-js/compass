const { expect } = require('chai');
const { RecentListStore } = require('../../');

describe('RecentListStore', () => {
  describe('#init', () => {
    it('initializes with the recent list', () => {
      expect(RecentListStore.state.recents.length).to.equal(0);
    });
  });

  describe('#onQueryApplied', () => {
    context('when the filter is blank', () => {
      before(() => {
        RecentListStore.onQueryApplied({ ns: 'test.test', filter: {}});
      });

      it('does not add the query to the list', () => {
        expect(RecentListStore.state.recents.length).to.equal(0);
      });
    });

    context('when the project is blank', () => {
      before(() => {
        RecentListStore.onQueryApplied({ ns: 'test.test', project: {}});
      });

      it('does not add the query to the list', () => {
        expect(RecentListStore.state.recents.length).to.equal(0);
      });
    });

    context('when the sort is blank', () => {
      before(() => {
        RecentListStore.onQueryApplied({ ns: 'test.test', sort: {}});
      });

      it('does not add the query to the list', () => {
        expect(RecentListStore.state.recents.length).to.equal(0);
      });
    });

    context('when the ns is blank', () => {
      before(() => {
        RecentListStore.onQueryApplied({ filter: { name: 'test' }});
      });

      it('does not add the query to the list', () => {
        expect(RecentListStore.state.recents.length).to.equal(0);
      });
    });

    context('when the attributes are not blank', () => {
      before(() => {
        RecentListStore.onQueryApplied({ ns: 'test.test', filter: { name: 'test' }});
      });

      after(() => {
        RecentListStore.state.recents.reset();
      });

      it('adds the query to the list', () => {
        expect(RecentListStore.state.recents.length).to.equal(1);
      });
    });
  });
});
