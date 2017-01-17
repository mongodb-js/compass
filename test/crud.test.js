/* eslint no-unused-vars: 0 */

const mock = require('mock-require');
const sinon = require('sinon');
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const bson = require('bson');
const mount = require('enzyme').mount;

// mock CRUD actions
const closeAllMenusSpy = sinon.spy();
closeAllMenusSpy.listen = () => {};

const crudActions = {
  documentRemoved: sinon.spy(),
  openInsertDocumentDialog: sinon.spy(),
  closeInsertDocumentDialog: sinon.spy(),
  insertDocument: sinon.spy(),
  fileDropped: sinon.spy(),
  refreshDocuments: sinon.spy(),
  closeAllMenus: closeAllMenusSpy
};

mock('../src/internal-packages/crud/lib/actions', crudActions);

const React = require('react');
const Element = require('hadron-document').Element;
const LineNumber = require('../src/internal-packages/crud/lib/component/line-number');

// use chai-enzyme assertions, see https://github.com/producthunt/chai-enzyme
chai.use(chaiEnzyme());

describe('CRUD', function() {
  const element = new Element(undefined, bson.Long.fromString('1'), false, {isRoot: () => false});

  describe('<LineNumber />', function() {
    it('renders a hadron-react-bson component for array values (COMPASS-646)', function() {
      const component = mount(<LineNumber element={element} />);
      expect(component.find('span.line-number-menu-field div.element-value')).to.have.className('element-value-is-int64');
    });
  });
});
