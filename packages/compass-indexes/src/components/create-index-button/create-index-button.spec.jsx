import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';

import CreateIndexButton from '../create-index-button';

describe('create-index-button [Component]', function() {
  let component;
  let toggleIsVisibleSpy;

  describe('not visible', function() {
    beforeEach(function() {
      toggleIsVisibleSpy = sinon.spy();
      component = mount(<CreateIndexButton toggleIsVisible={toggleIsVisibleSpy}/>);
    });

    afterEach(function() {
      toggleIsVisibleSpy = null;
      component = null;
    });

    it('renders the correct root classname', function() {
      expect(component.find('.create-index-btn')).to.be.present();
    });

    it('renders a button', function() {
      expect(
        component.find('[data-test-id="open-create-index-modal-button"]')
      ).to.be.present();
    });
  });
});
