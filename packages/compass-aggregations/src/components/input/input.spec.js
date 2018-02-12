import React from 'react';
import { shallow } from 'enzyme';

import Input from 'components/input';
import InputToolbar from 'components/input-toolbar';
import styles from './input.less';

describe('Input [Component]', () => {
  let component;
  let toggleSpy;
  let refreshSpy;

  const inputDocuments = {
    documents: [],
    isExpanded: true,
    count: 0
  };

  beforeEach(() => {
    toggleSpy = sinon.spy();
    refreshSpy = sinon.spy();

    component = shallow(
      <Input
        refreshInputDocuments={refreshSpy}
        toggleInputDocumentsCollapsed={toggleSpy}
        inputDocuments={inputDocuments} />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles.input}`)).to.be.present();
  });

  it('renders the toolbar', () => {
    expect(component.find(`.${styles.input}`)).to.have.descendants(InputToolbar);
  });
});
