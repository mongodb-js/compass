import React from 'react';
import Reflux from 'reflux';
import app from 'hadron-app';
import AppRegistry from 'hadron-app-registry';
import { mount } from 'enzyme';
import HadronDocument from 'hadron-document';
import EditableDocument from 'components/editable-document';
import EditableElement from 'components/editable-element';
import EditableValue from 'components/editable-value';

describe('<EditableDocument />', () => {
  before(() => {
    global.hadronApp = app;
    global.hadronApp.appRegistry = new AppRegistry();
  });

  after(() => {
    global.hadronApp.appRegistry = new AppRegistry();
  });

  describe('#render', () => {
    let wrapper;
    const doc = { a: 1, b: 2 };
    const action = Reflux.createAction();

    before(() => {
      wrapper = mount(
        <EditableDocument
          doc={new HadronDocument(doc)}
          removeDocument={sinon.spy(action)}
          replaceDocument={sinon.spy(action)}
          updateDocument={sinon.spy(action)}
          copyToClipboard={sinon.spy(action)}
          version="3.4.0"
          tz="UTC"
          openImportFileDialog={sinon.spy(action)}
          openInsertDocumentDialog={sinon.spy(action)} />
      );
    });

    it('renders the list div', () => {
      const component = wrapper.find('.document');
      expect(component).to.be.present();
    });

    it('renders the base element list', () => {
      const component = wrapper.find('.document-elements');
      expect(component).to.be.present();
    });

    it('renders an editable element for each document element', () => {
      const component = wrapper.find('.document-elements');
      expect(component.children().length).to.equal(2);
    });

    context('COMPASS-1732 when the value is an array', () => {
      // .focus() costs ~30ms to call, so instead of focusing every array
      // element, jump straight to the last array element.
      // NOTE: keeping this test as a reminder of focus, but was always invalid:
      // https://github.com/airbnb/enzyme/issues/1795
      const _focus = window.HTMLElement.prototype.focus;
      let spy;
      before(() => {
        spy = sinon.spy(_focus);
        window.HTMLElement.prototype.focus = spy;
        const arrayDoc = {
          long_array: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
        };
        wrapper = mount(
          <EditableDocument
            doc={new HadronDocument(arrayDoc)}
            removeDocument={sinon.spy(action)}
            replaceDocument={sinon.spy(action)}
            updateDocument={sinon.spy(action)}
            copyToClipboard={sinon.spy(action)}
            version="3.4.0"
            tz="UTC"
            openImportFileDialog={sinon.spy(action)}
            openInsertDocumentDialog={sinon.spy(action)} />
        );

        // Set build version, so setState does not throw an error
        wrapper.setState({
          editing: true,
          expandAll: true
        });
        const editables = wrapper.find(EditableElement);
        const secondLastElement = editables.slice(-2, -1);
        secondLastElement.find(EditableValue).find('input');
      });

      after(() => {
        // Restore global variables so they shouldn't leak into other tests
        window.HTMLElement.prototype.focus = _focus;
      });

      it('it never focuses inputs such as the second last', () => {
        expect(spy.callCount).to.be.equal(1);
      });
    });
  });
});
