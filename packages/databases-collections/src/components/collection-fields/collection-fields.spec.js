import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import { Select, TextInput } from '@mongodb-js/compass-components';

import CollectionFields from '.';

describe('CollectionFields [Component]', () => {
  context('when withDatabase prop is true', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <CollectionFields
          onChange={() => {}}
          withDatabase
          serverVersion="5.0"
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders a database name input field', () => {
      expect(component.find(TextInput).length).to.equal(2);
      expect(component.text().includes('Database Name')).to.equal(true);
    });
  });

  context('when withDatabase prop is false', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <CollectionFields
          onChange={() => {}}
          serverVersion="5.0"
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('does not render a database name input field', () => {
      expect(component.find(TextInput).length).to.equal(1);
      expect(component.text().includes('Database Name')).to.equal(false);
    });
  });

  context('with server version >= 5.0', () => {
    let component;
    let onChangeSpy;

    beforeEach(() => {
      onChangeSpy = sinon.spy();
      component = mount(
        <CollectionFields
          onChange={onChangeSpy}
          withDatabase
          serverVersion="5.0"
        />
      );
    });

    afterEach(() => {
      component = null;
      onChangeSpy = null;
    });

    it('shows time series options', () => {
      expect(component.text().includes('Time-Series')).to.equal(true);
    });

    describe('when the time series checkbox is clicked', () => {
      beforeEach(() => {
        component.find('input[type="checkbox"]').at(2).simulate(
          'change', { target: { checked: true } }
        );
        component.update();
      });

      it('calls the onchange with time series collection on', () => {
        expect(onChangeSpy.callCount).to.equal(1);
        expect(onChangeSpy.firstCall.args[0]).to.deep.equal({
          database: '',
          collection: '',
          options: {
            timeseries: {}
          }
        });
      });
    });
  });

  context('with server version < 5.0', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <CollectionFields
          onChange={() => {}}
          withDatabase
          serverVersion="4.3.0"
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('does not show time series options', () => {
      expect(component.text().includes('Time-Series')).to.equal(false);
    });
  });

  context('when rendered', () => {
    let component;
    let onChangeSpy;

    beforeEach(() => {
      onChangeSpy = sinon.spy();

      component = mount(
        <CollectionFields
          onChange={onChangeSpy}
          serverVersion="4.3.0"
        />
      );
    });

    afterEach(() => {
      component = null;
      onChangeSpy = null;
    });

    describe('when the collation checkbox is clicked', () => {
      beforeEach(() => {
        component.find('input[type="checkbox"]').at(1).simulate(
          'change', { target: { checked: true } }
        );
        component.update();
      });

      it('calls the onchange with collation', () => {
        expect(onChangeSpy.callCount).to.equal(1);
        expect(onChangeSpy.firstCall.args[0]).to.deep.equal({
          database: '',
          collection: '',
          options: {
            collation: {}
          }
        });
      });
    });

    describe('when the collation checkbox is clicked and a locale chosen', () => {
      beforeEach(() => {
        component.find('input[type="checkbox"]').at(1).simulate(
          'change', { target: { checked: true } }
        );
        component.update();
        component.find(Select).at(0).props().onChange(
          'af'
        );
        component.update();
      });

      it('calls the onchange with collation locale set', () => {
        expect(onChangeSpy.callCount).to.equal(2);
        expect(onChangeSpy.secondCall.args[0]).to.deep.equal({
          database: '',
          collection: '',
          options: {
            collation: {
              locale: 'af'
            }
          }
        });
      });
    });

    describe('when the capped collection checkbox is clicked', () => {
      beforeEach(() => {
        component.find('input[type="checkbox"]').at(0).simulate(
          'change', { target: { checked: true } }
        );
        component.update();
      });

      it('calls the onchange with capped collection on', () => {
        expect(onChangeSpy.callCount).to.equal(1);
        expect(onChangeSpy.firstCall.args[0]).to.deep.equal({
          database: '',
          collection: '',
          options: {
            capped: true
          }
        });
      });
    });

    describe('when the capped collection checkbox is clicked twice', () => {
      beforeEach(() => {
        component.find('input[type="checkbox"]').at(0).simulate(
          'change', { target: { checked: true } }
        );
        component.update();
        component.find('input[type="checkbox"]').at(0).simulate(
          'change', { target: { checked: false } }
        );
        component.update();
      });

      it('calls the onchange with capped collection off', () => {
        expect(onChangeSpy.callCount).to.equal(2);
        expect(onChangeSpy.secondCall.args[0]).to.deep.equal({
          database: '',
          collection: '',
          options: {}
        });
      });
    });
  });
});
