import React from 'react';
import app from 'hadron-app';
import AppRegistry from 'hadron-app-registry';
import { mount } from 'enzyme';
import HadronDocument from 'hadron-document';
import EditableElement from 'components/editable-element';

describe('<EditableElement />', () => {
  before(() => {
    global.hadronApp = app;
    global.hadronApp.appRegistry = new AppRegistry();
  });

  after(() => {
    global.hadronApp.appRegistry = new AppRegistry();
  });

  describe('#render', () => {
    it('renders a remove button full non-editable elements', () => {
      const doc = { a: 10, c: null, _id: 'not-editable' };
      for (const element of new HadronDocument(doc).elements) {
        expect(element.isValueEditable()).to.equal(element.key === 'a');

        const wrapper = mount(
          <EditableElement
            editing
            edit={() => {}}
            tz="UTC"
            version="3.4.0"
            index={0}
            indent={0}
            expandAll
            element={element} />
        );

        const component = wrapper.find('.fa-times-circle');
        if (element.key === '_id') {
          expect(component).not.to.be.present();
        } else {
          expect(component).to.be.present();
        }
      }
    });
  });
});
