import React from 'react';
import { shallow } from 'enzyme';
import { CODE } from 'modules/view';

import BuilderToolbar from 'components/builder-toolbar';
import styles from './builder-toolbar.less';

describe('BuilderToolbar [Component]', () => {
  let component;
  let stageAddedSpy;
  let viewChangedSpy;
  let copyToClipboardSpy;

  beforeEach(() => {
    stageAddedSpy = sinon.spy();
    viewChangedSpy = sinon.spy();
    copyToClipboardSpy = sinon.spy();

    component = shallow(
      <BuilderToolbar
        view={CODE}
        stageAdded={stageAddedSpy}
        viewChanged={viewChangedSpy}
        copyToClipboard={copyToClipboardSpy} />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['builder-toolbar']}`)).to.be.present();
  });
});
