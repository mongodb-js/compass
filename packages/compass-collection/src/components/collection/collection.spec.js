import React from 'react';
import { mount } from 'enzyme';

import Collection from 'components/collection';
import styles from './collection.less';

describe('Collection [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(
      <Collection
        isReadonly={false}
        tabs={[]}
        views={[]}
        queryHistoryIndexes={[]}
        statsPlugin={null}
        statsStore={null}
        namespace="db.coll" />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles.collection}`)).to.be.present();
  });

  it('must show the view-icon', () => {
    console.log(styles['collection-title-readonly-view-icon']);
    expect(
      component.find(`.${styles['collection-title-readonly-view-icon']}`)
    ).to.be.present();
  });

  it('must include the collection name the view is based on', () => {
    expect(
      component.find(`.${styles['collection-title-readonly-view-on']}`)
    ).to.include.text('(on: bands)');
  });
});
