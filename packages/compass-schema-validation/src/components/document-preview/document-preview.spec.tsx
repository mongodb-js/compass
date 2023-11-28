import React from 'react';
import { mount, shallow } from 'enzyme';
import { expect } from 'chai';

import DocumentPreview from '.';

describe('DocumentPreview [Component]', function () {
  context('when document loading state is initial', function () {
    it('renders a button to load a sample document', function () {
      const component = mount(<DocumentPreview loadingState="initial" />);
      expect(component.find('[data-testid="load-sample-document"]')).to.exist;
    });
  });

  context('when document loading state is loading', function () {
    it('renders a spinner', function () {
      const component = mount(<DocumentPreview loadingState="loading" />);
      expect(component.find('[data-testid="load-sample-spinner"]')).to.exist;
    });
  });

  context('when document loading state is success', function () {
    it('renders a document if there is one present', function () {
      const component = shallow(
        <DocumentPreview loadingState="success" document={{}} />
      );
      expect(component.find('Document')).to.exist;
    });

    it('renders a no preview text when there is no document', function () {
      const component = mount(<DocumentPreview loadingState="success" />);
      expect(component).to.have.text('No Preview Documents');
    });
  });

  context('when document loading state is error', function () {
    it('renders a no preview text', function () {
      const component = mount(<DocumentPreview loadingState="error" />);
      expect(component).to.have.text('No Preview Documents');
    });
  });
});
