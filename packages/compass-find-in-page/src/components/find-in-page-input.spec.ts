import { InputGroup, FormControl } from 'react-bootstrap';
import React from 'react';
import { shallow } from 'enzyme';

import FindInPageInput from './find-in-page-input';
import styles from './find-in-page-input.module.less';

describe('FindInPageInput [Component]', () => {
  context('when the component is first rendered', () => {
    let component;

    const dispatchStopFind = sinon.spy();
    const setSearchTerm = sinon.spy();
    const toggleStatus = sinon.spy();
    const dispatchFind = sinon.spy();
    const searching = false;
    const searchTerm = '';

    beforeEach(() => {
      component = shallow(
        <FindInPageInput
          dispatchStopFind={dispatchStopFind}
          setSearchTerm={setSearchTerm}
          toggleStatus={toggleStatus}
          dispatchFind={dispatchFind}
          searchTerm={searchTerm}
          searching={searching}
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the correct top level classname', () => {
      expect(component.find(`.${styles.wrapper}`)).to.be.present();
    });

    it('should have navigation text in top span', () => {
      expect(component.find(`.${styles['wrapper-span']}`)).to.contain.text(
        'Use (Shift+) Enter to navigate results.'
      );
    });

    it('should contain Input Group', () => {
      expect(
        component.find('[data-test-id="find-in-page"]')
      ).to.have.descendants(InputGroup);
    });

    it('input should have empty value', () => {
      expect(component.find(FormControl)).prop('value').to.be.equal('');
    });

    it('close button should be present', () => {
      expect(component.find(`.${styles['find-close']}`)).to.be.present();
    });

    it('close button should have &times; text', () => {
      expect(
        component.find(`.${styles['find-close-box']} > span`)
      ).to.contain.text('×');
    });
  });

  context('when the component is rendered and search term has a value', () => {
    let component;

    const dispatchStopFind = sinon.spy();
    const setSearchTerm = sinon.spy();
    const toggleStatus = sinon.spy();
    const dispatchFind = sinon.spy();
    const searching = false;
    const searchTerm = 'search term';

    beforeEach(() => {
      component = shallow(
        <FindInPageInput
          dispatchStopFind={dispatchStopFind}
          setSearchTerm={setSearchTerm}
          toggleStatus={toggleStatus}
          dispatchFind={dispatchFind}
          searchTerm={searchTerm}
          searching={searching}
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the correct top level classname', () => {
      expect(component.find(`.${styles.wrapper}`)).to.be.present();
    });

    it('should have navigation text in top span', () => {
      expect(component.find(`.${styles['wrapper-span']}`)).to.contain.text(
        'Use (Shift+) Enter to navigate results.'
      );
    });

    it('should contain Input Group', () => {
      expect(
        component.find('[data-test-id="find-in-page"]')
      ).to.have.descendants(InputGroup);
    });

    it('input field should have search term as value', () => {
      expect(component.find(FormControl))
        .prop('value')
        .to.be.equal('search term');
    });
  });
});
