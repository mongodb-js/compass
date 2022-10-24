import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import { Databases } from '.';

describe('Databases [Component]', function() {
  let component;
  describe('genuine with dbs', function() {
    beforeEach(function() {
      component = mount(<Databases
        databasesStatus={{ status: 'ready' }}
        databases={[{ name: 'db1' }]}
        isGenuineMongoDB
      />);
    });

    afterEach(function() {
      component.unmount();
      component = null;
    });

    it('does not render warning zero state', function() {
      expect(component.find('[data-testid="databases-non-genuine-warning"]')).to.not.be.present();
    });
  });
  describe('genuine without dbs', function() {
    beforeEach(function() {
      component = mount(<Databases
        databasesStatus={{ status: 'ready' }}
        databases={[]}
        isGenuineMongoDB
      />);
    });

    afterEach(function() {
      component.unmount();
      component = null;
    });

    it('does not render warning zero state', function() {
      expect(component.find('[data-testid="databases-non-genuine-warning"]')).to.not.be.present();
    });
  });

  describe('non-genuine with dbs', function() {
    beforeEach(function() {
      component = mount(<Databases
        databasesStatus={{ status: 'ready' }}
        databases={[{ name: 'db1' }]}
        isGenuineMongoDB={false}
      />);
    });

    afterEach(function() {
      component.unmount();
      component = null;
    });

    it('does not render warning zero state', function() {
      expect(component.find('[data-testid="databases-non-genuine-warning"]')).to.not.be.present();
    });
  });
  describe('non-genuine without dbs', function() {
    beforeEach(function() {
      component = mount(<Databases
        databasesStatus={{ status: 'ready' }}
        databases={[]}
        isGenuineMongoDB={false}
      />);
    });

    afterEach(function() {
      component.unmount();
      component = null;
    });

    it('does not render grid', function() {
      expect(component.find('[data-testid="database-grid"]')).to.not.be.present();
    });
    it('renders warning zero state', function() {
      expect(component.find('[data-testid="databases-non-genuine-warning"]')).to.be.present();
    });
  });
});
