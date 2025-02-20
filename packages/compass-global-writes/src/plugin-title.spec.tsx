import React from 'react';
import { expect } from 'chai';
import { PluginTitle } from './plugin-title';
import { render, screen } from '@mongodb-js/testing-library-compass';

describe('PluginTitle', function () {
  it('Renders a warning when showError', function () {
    render(<PluginTitle showError={true} showWarning={false} />);
    expect(screen.getByLabelText('warning')).to.be.visible;
  });

  it("Renders an 'important' warning when showWarning", function () {
    render(<PluginTitle showError={false} showWarning={true} />);
    expect(screen.getByLabelText('important')).to.be.visible;
  });

  it('Does not render a warning', function () {
    render(<PluginTitle showError={false} showWarning={false} />);
    expect(screen.queryByLabelText('warning')).not.to.exist;
    expect(screen.queryByLabelText('important')).not.to.exist;
  });
});
