import React from 'react';
import { mount } from 'enzyme';

import Databases, { Databases as UnconnectedDatabases } from '../databases';
import Toolbar from '../toolbar';
import store from '../../stores';
import styles from './databases.less';

import { INITIAL_STATE as columns} from '../../modules/columns';

describe('databases [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(<Databases store={store} />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles.databases}`)).to.be.present();
  });

  it('should contain the data-test-id', () => {
    expect(component.find('[data-test-id="databases-table"]')).to.be.present();
  });

  it('renders a toolbar', () => {
    expect(component.find(Toolbar)).to.be.present();
  });
});

describe('databases [Unmapped]', () => {
  let component;
  describe('genuine with dbs', () => {
    beforeEach(() => {
      component = mount(<UnconnectedDatabases
        columns={columns}
        databases={['db1']}
        isGenuineMongoDB
      />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles.databases}`)).to.be.present();
    });
    it('does not render warning zero state', () => {
      expect(component.find(`.${styles['databases-non-genuine-warning']}`)).to.not.be.present();
    });
  });
  describe('genuine without dbs', () => {
    beforeEach(() => {
      component = mount(<UnconnectedDatabases
        columns={columns}
        databases={[]}
        isGenuineMongoDB
      />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles.databases}`)).to.be.present();
    });
    it('does not render warning zero state', () => {
      expect(component.find(`.${styles['databases-non-genuine-warning']}`)).to.not.be.present();
    });
  });
  describe('non-genuine with dbs', () => {
    beforeEach(() => {
      component = mount(<UnconnectedDatabases
        columns={columns}
        databases={['db1']}
        isGenuineMongoDB={false}
      />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles.databases}`)).to.be.present();
    });
    it('does not render warning zero state', () => {
      expect(component.find(`.${styles['databases-non-genuine-warning']}`)).to.not.be.present();
    });
  });
  describe('non-genuine without dbs', () => {
    beforeEach(() => {
      component = mount(<UnconnectedDatabases
        columns={columns}
        databases={[]}
        isGenuineMongoDB={false}
      />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles.databases}`)).to.be.present();
    });
    it('does not render warning zero state', () => {
      expect(component.find(`.${styles['databases-non-genuine-warning']}`)).to.be.present();
    });
  });
});
