import React from 'react';
import { expect } from 'chai';
import { PluginTitle } from './plugin-title';
import { render, screen } from '@mongodb-js/testing-library-compass';
import Sinon from 'sinon';

describe('PluginTitle', function () {
  let onVisibilityChanged: Sinon.SinonSpy;

  beforeEach(function () {
    onVisibilityChanged = Sinon.spy();
  });

  afterEach(function () {
    onVisibilityChanged.resetHistory();
  });

  it('Renders a warning', function () {
    render(
      <PluginTitle
        onVisibilityChanged={onVisibilityChanged}
        showWarning={true}
      />
    );
    expect(screen.getByLabelText('warning')).to.be.visible;
  });

  it('Does not render a warning', function () {
    render(
      <PluginTitle
        onVisibilityChanged={onVisibilityChanged}
        showWarning={false}
      />
    );
    expect(screen.queryByLabelText('warning')).not.to.exist;
  });

  it('Calls the onVisibilityChanged callback when dismounted', function () {
    const mount = render(
      <PluginTitle
        onVisibilityChanged={onVisibilityChanged}
        showWarning={false}
      />
    );

    expect(onVisibilityChanged).to.have.been.calledOnceWith(true);

    mount.unmount();

    expect(onVisibilityChanged).to.have.been.calledTwice;
    expect(onVisibilityChanged.getCalls()[1].args[0]).to.equal(false);
  });
});
