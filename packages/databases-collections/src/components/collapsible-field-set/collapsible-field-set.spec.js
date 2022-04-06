import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import { Link } from '@mongodb-js/compass-components';

import CollapsibleFieldSet from './collapsible-field-set';

describe('CollapsibleFieldSet [Component]', () => {
  context('when there is a helpUrl prop', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <CollapsibleFieldSet
          withDatabase
          label="aa"
          description="ah"
          helpUrl="aaa"
          onToggle={() => {}}
        />
      );
    });

    afterEach(() => {
      component = null;
    });


    it('renders a help link', () => {
      expect(component.find(Link)).to.be.present();
      expect(component.find(Link).prop('href')).to.be.equal('aaa');
    });
  });

  context('when there is no helpUrl prop', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <CollapsibleFieldSet
          withDatabase
          label="aa"
          onToggle={() => {}}
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('does not render a help link', () => {
      expect(component.find(Link)).to.not.be.present();
    });
  });

  describe('when the checkbox is clicked', () => {
    let component;
    let onToggleSpy;

    beforeEach(() => {
      onToggleSpy = sinon.spy();
      component = mount(
        <CollapsibleFieldSet
          withDatabase
          label="aa"
          onToggle={onToggleSpy}
        >
          Pineapple
        </CollapsibleFieldSet>
      );
      component.find('input[type="checkbox"]').at(0).simulate(
        'change', { target: { checked: true } }
      );
      component.update();
    });

    afterEach(() => {
      component = null;
      onToggleSpy = null;
    });

    it('calls the onToggle', () => {
      expect(onToggleSpy.callCount).to.equal(1);
      expect(onToggleSpy.firstCall.args[0]).to.equal(true);
    });
  });

  describe('when the "toggled" prop is "true"', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <CollapsibleFieldSet
          withDatabase
          label="aa"
          onToggle={() => {}}
          toggled
        >
          Pineapple
        </CollapsibleFieldSet>
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the nested components', () => {
      expect(component.text()).to.include('Pineapple');
    });
  });

  describe('when the "toggled" prop is "false"', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <CollapsibleFieldSet
          withDatabase
          label="aa"
          onToggle={() => {}}
        >
          Pineapple
        </CollapsibleFieldSet>
      );
    });

    afterEach(() => {
      component = null;
    });

    it('does not render the nested components', () => {
      expect(component.text()).to.not.include('Pineapple');
    });
  });
});
