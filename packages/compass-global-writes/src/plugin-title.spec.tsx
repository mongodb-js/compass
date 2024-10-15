import React from 'react';
import { expect } from 'chai';
import { PluginTitle } from './plugin-title';
import { render, screen } from '@mongodb-js/testing-library-compass';

describe('PluginTitle', function () {
  it('Renders a warning', function () {
    render(<PluginTitle showWarning={true} />);
    expect(screen.getByLabelText('warning')).to.be.visible;
  });

  it('Does not render a warning', function () {
    render(<PluginTitle showWarning={false} />);
    expect(screen.queryByLabelText('warning')).not.to.exist;
  });
});
