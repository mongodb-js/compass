import { cleanup, render } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import React from 'react';
import {
  useConnectionColor,
  CONNECTION_COLOR_CODES,
  COLOR_CODE_TO_NAME,
} from './use-connection-color';

function TestComponent({
  colorCode,
}: {
  colorCode: string;
}): React.ReactElement {
  const { connectionColorToHex, connectionColorToName } = useConnectionColor();
  return (
    <>
      <div>{connectionColorToHex(colorCode)}</div>
      <div>{connectionColorToName(colorCode)}</div>
    </>
  );
}

describe('useConnectionColor', function () {
  afterEach(cleanup);

  it('converts a color code to hex', function () {
    for (const colorCode of CONNECTION_COLOR_CODES) {
      const { container } = render(<TestComponent colorCode={colorCode} />);
      expect(container.firstChild?.textContent).to.match(
        /^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/
      );
    }
  });

  it('does not convert an unknown color code', function () {
    const { container } = render(
      <TestComponent colorCode={'someKindOfColor'} />
    );
    expect(container.firstChild?.textContent).to.be.empty;
  });

  it('does not convert an unknown hex code', function () {
    const { container } = render(<TestComponent colorCode={'#100000'} />);
    expect(container.firstChild?.textContent).to.be.empty;
  });

  describe('connection color names', function () {
    for (const [color, name] of Object.entries(COLOR_CODE_TO_NAME)) {
      it(`${color} is named ${name}`, function () {
        const { container } = render(<TestComponent colorCode={color} />);
        expect(container.children[1].textContent).to.equal(name);
      });
    }
  });
});
