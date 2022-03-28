import React from 'react';
import Reflux from 'reflux';
import app from 'hadron-app';
import AppRegistry from 'hadron-app-registry';
import { mount } from 'enzyme';
import HadronDocument from 'hadron-document';
import EditableDocument from './editable-document';

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
    const doc = { a: 1, b: 2, c: null };
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
      const component = wrapper.find('[data-testid="hadron-document-element"]');
      expect(component).to.have.lengthOf(3);
    });
  });
});
