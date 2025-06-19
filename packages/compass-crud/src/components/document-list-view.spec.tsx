import React from 'react';
import { mount } from 'enzyme';
import type { ReactWrapper } from 'enzyme';
import HadronDocument from 'hadron-document';
import { expect } from 'chai';

import DocumentListView from './document-list-view';
import { CompassComponentsProvider } from '@mongodb-js/compass-components';

describe('<DocumentListView />', function () {
  describe('#render', function () {
    context('when the documents have objects for ids', function () {
      const docs = [{ _id: { name: 'test-1' } }, { _id: { name: 'test-2' } }];
      const hadronDocs = docs.map((doc) => new HadronDocument(doc));
      let component: ReactWrapper;
      beforeEach(function () {
        component = mount(
          <DocumentListView
            docs={hadronDocs}
            isEditable={false}
            isTimeSeries={false}
          />,
          { wrappingComponent: CompassComponentsProvider }
        );
      });

      afterEach(function () {
        component?.unmount();
      });

      it('renders all the documents', function () {
        const wrapper = component.find('[data-testid="readonly-document"]');
        expect(wrapper).to.have.length(2);
      });
    });
  });
});
