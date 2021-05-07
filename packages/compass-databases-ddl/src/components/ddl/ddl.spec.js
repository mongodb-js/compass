import React from 'react';
import { mount } from 'enzyme';

import Ddl, { Ddl as UnmappedDdl } from 'components/ddl';
import Toolbar from 'components/toolbar';
import store from 'stores';
import styles from './ddl.less';

import { INITIAL_STATE as columns} from 'modules/columns';

describe('Ddl [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(<Ddl store={store} />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles.ddl}`)).to.be.present();
  });

  it('should contain the data-test-id', () => {
    expect(component.find('[data-test-id="databases-table"]')).to.be.present();
  });

  it('renders a toolbar', () => {
    expect(component.find(Toolbar)).to.be.present();
  });
});

describe('Ddl [Unmapped]', () => {
  let component;
  describe('genuine with dbs', () => {
    beforeEach(() => {
      component = mount(<UnmappedDdl
        columns={columns}
        databases={['db1']}
        isGenuineMongoDB
      />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles.ddl}`)).to.be.present();
    });
    it('does not render warning zero state', () => {
      expect(component.find(`.${styles['ddl-non-genuine-warning']}`)).to.not.be.present();
    });
  });
  describe('genuine without dbs', () => {
    beforeEach(() => {
      component = mount(<UnmappedDdl
        columns={columns}
        databases={[]}
        isGenuineMongoDB
      />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles.ddl}`)).to.be.present();
    });
    it('does not render warning zero state', () => {
      expect(component.find(`.${styles['ddl-non-genuine-warning']}`)).to.not.be.present();
    });
  });
  describe('non-genuine with dbs', () => {
    beforeEach(() => {
      component = mount(<UnmappedDdl
        columns={columns}
        databases={['db1']}
        isGenuineMongoDB={false}
      />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles.ddl}`)).to.be.present();
    });
    it('does not render warning zero state', () => {
      expect(component.find(`.${styles['ddl-non-genuine-warning']}`)).to.not.be.present();
    });
  });
  describe('non-genuine without dbs', () => {
    beforeEach(() => {
      component = mount(<UnmappedDdl
        columns={columns}
        databases={[]}
        isGenuineMongoDB={false}
      />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles.ddl}`)).to.be.present();
    });
    it('does not render warning zero state', () => {
      expect(component.find(`.${styles['ddl-non-genuine-warning']}`)).to.be.present();
    });
  });
});
