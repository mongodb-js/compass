const { expect } = require('chai');
const BreadcrumbStore = require('../../../lib/stores/breadcrumb-store');
const { Element } = require('hadron-document');
const AppRegistry = require('hadron-app-registry');

describe('BreadcrumbStore', () => {
  before((done) => {
    global.hadronApp.appRegistry = new AppRegistry();
    global.hadronApp.appRegistry.registerStore('CRUD.Store', BreadcrumbStore);
    global.hadronApp.appRegistry.onActivated();
    done();
  });

  after(() => {
    global.hadronApp.appRegistry = undefined;
  });

  describe('#breadcrumbStore', () => {
    const path = ['field1', 'field2'];
    const types = ['Object', 'Array'];
    const document = {field4: 'value'};
    const element = new Element('field3', 'value');

    it('triggers with collection changed', (done) => {
      const unsubscribe = BreadcrumbStore.listen((params) => {
        expect(params.collection).to.equal('test');
        expect(params.path).to.deep.equal([]);
        expect(params.types).to.deep.equal([]);
        expect(params.document).to.equal(null);
        unsubscribe();
        done();
      });
      BreadcrumbStore.onCollectionChanged('compass-crud.test');
    });

    it('triggers when path changed', (done) => {
      const unsubscribe = BreadcrumbStore.listen((params) => {
        expect(params.path).to.deep.equal(path);
        expect(params.types).to.deep.equal(types);
        expect(params.document).to.equal(null);
        expect(params.collection).to.equal(undefined);
        unsubscribe();
        done();
      });
      BreadcrumbStore.pathChanged(path, types);
    });

    path.push('field3');
    types.push('String');

    it('triggers when drill down', (done) => {
      const unsubscribe = BreadcrumbStore.listen((params) => {
        expect(params.path).to.deep.equal(path);
        expect(params.types).to.deep.equal(types);
        expect(params.document).to.equal(document);
        expect(params.collection).to.equal(undefined);
        expect(params.editParams).to.deep.equal({colId: 1, rowIndex: 0});
        unsubscribe();
        done();
      });
      BreadcrumbStore.drillDown(document, element, {colId: 1, rowIndex: 0});
    });
  });
});
