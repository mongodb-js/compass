import React from 'react';
import { mount, shallow } from 'enzyme';
import { expect } from 'chai';

import DocumentPreview from '../document-preview';
import { DOCUMENT_LOADING_STATES } from '../../modules/sample-documents';

describe('DocumentPreview [Component]', function () {
  context('when document loading state is initial', function () {
    it('renders a button to load a sample document', function () {
      const component = mount(
        <DocumentPreview loadingState={DOCUMENT_LOADING_STATES.INITIAL} />
      );
      expect(
        component.find('[data-testid="load-sample-document"]')
      ).to.be.present();
    });
  });

  context('when document loading state is loading', function () {
    it('renders a spinner', function () {
      const component = mount(
        <DocumentPreview loadingState={DOCUMENT_LOADING_STATES.LOADING} />
      );
      expect(
        component.find('[data-testid="load-sample-spinner"]')
      ).to.be.present();
    });
  });

  context('when document loading state is success', function () {
    it('renders a document if there is one present', function () {
      const component = shallow(
        <DocumentPreview
          loadingState={DOCUMENT_LOADING_STATES.SUCCESS}
          document={{}}
        />
      );
      expect(component.find('Document')).to.be.present();
    });

    it('renders a no preview text when there is no document', function () {
      const component = mount(
        <DocumentPreview loadingState={DOCUMENT_LOADING_STATES.SUCCESS} />
      );
      expect(component).to.have.text('No Preview Documents');
    });
  });

  context('when document loading state is error', function () {
    it('renders a no preview text', function () {
      const component = mount(
        <DocumentPreview loadingState={DOCUMENT_LOADING_STATES.ERROR} />
      );
      expect(component).to.have.text('No Preview Documents');
    });
  });
});
