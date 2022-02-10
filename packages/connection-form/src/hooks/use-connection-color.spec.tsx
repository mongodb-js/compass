import { cleanup, render } from '@testing-library/react';
import { expect } from 'chai';
import React from 'react';
import {
  useConnectionColor,
  CONNECTION_COLOR_CODES,
} from './use-connection-color';

function TestComponent({
  colorCode,
}: {
  colorCode: string;
}): React.ReactElement {
  const { connectionColorToHex } = useConnectionColor();
  return <div>{connectionColorToHex(colorCode)}</div>;
}

describe('useConnectionColor', function () {
  afterEach(cleanup);

  it('converts a color code to hex', function () {
    for (const colorCode of CONNECTION_COLOR_CODES) {
      const { container } = render(<TestComponent colorCode={colorCode} />);
      expect(container.firstChild.textContent).to.match(
        /^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/
      );
    }
  });

  it('converts legacy colors', function () {
    const legacyColors = {
      '#5fc86e': 'color1',
      '#326fde': 'color2',
      '#deb342': 'color3',
      '#d4366e': 'color4',
      '#59c1e2': 'color5',
      '#2c5f4a': 'color6',
      '#d66531': 'color7',
      '#773819': 'color8',
      '#3b8196': 'color9',
      '#ababab': 'color10',
    };

    for (const [legacyColor, colorCode] of Object.entries(legacyColors)) {
      const { container: container1 } = render(
        <TestComponent colorCode={legacyColor} />
      );
      const { container: container2 } = render(
        <TestComponent colorCode={colorCode} />
      );
      expect(container1.firstChild.textContent).to.equal(
        container2.firstChild.textContent
      );
    }
  });

  it('does not convert an unknown color code', function () {
    const { container } = render(
      <TestComponent colorCode={'someKindOfColor'} />
    );
    expect(container.firstChild.textContent).to.be.empty;
  });

  it('does not convert an unknown hex code', function () {
    const { container } = render(<TestComponent colorCode={'#100000'} />);
    expect(container.firstChild.textContent).to.be.empty;
  });
});
