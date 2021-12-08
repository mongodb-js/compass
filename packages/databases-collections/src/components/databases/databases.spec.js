import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import { Databases } from '../databases';

describe('Databases [Component]', () => {
  let component;
  describe('genuine with dbs', () => {
    beforeEach(() => {
      component = mount(<Databases
        databases={[{ name: 'db1' }]}
        isGenuineMongoDB
      />);
    });

    afterEach(() => {
      component.unmount();
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find('[data-testid="database-grid"]')).to.be.present();
    });
    it('does not render warning zero state', () => {
      expect(component.find('[data-testid="databases-non-genuine-warning"]')).to.not.be.present();
    });
  });
  describe('genuine without dbs', () => {
    beforeEach(() => {
      component = mount(<Databases
        databases={[]}
        isGenuineMongoDB
      />);
    });

    afterEach(() => {
      component.unmount();
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find('[data-testid="database-grid"]')).to.be.present();
    });
    it('does not render warning zero state', () => {
      expect(component.find('[data-testid="databases-non-genuine-warning"]')).to.not.be.present();
    });
  });

  describe('non-genuine with dbs', () => {
    beforeEach(() => {
      component = mount(<Databases
        databases={[{ name: 'db1' }]}
        isGenuineMongoDB={false}
      />);
    });

    afterEach(() => {
      component.unmount();
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find('[data-testid="database-grid"]')).to.be.present();
    });
    it('does not render warning zero state', () => {
      expect(component.find('[data-testid="databases-non-genuine-warning"]')).to.not.be.present();
    });
  });
  describe('non-genuine without dbs', () => {
    beforeEach(() => {
      component = mount(<Databases
        databases={[]}
        isGenuineMongoDB={false}
      />);
    });

    afterEach(() => {
      component.unmount();
      component = null;
    });

    it('does not render grid', () => {
      expect(component.find('[data-testid="database-grid"]')).to.not.be.present();
    });
    it('renders warning zero state', () => {
      expect(component.find('[data-testid="databases-non-genuine-warning"]')).to.be.present();
    });
  });
});
