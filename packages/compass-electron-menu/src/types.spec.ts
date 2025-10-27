import { expect } from 'chai';
import { transformAppMenu } from './types';

describe('transformAppMenu', function () {
  it('transforms menu items using the callback', function () {
    expect(
      transformAppMenu(
        {
          label: '42',
          click: 'quux',
          submenu: [
            { label: 'Item 1', click: 'foo' },
            { label: 'Item 2', click: 'bar' },
          ],
        },
        (item) => ({ ...item, click: item.click?.length, extra: 'abc' })
      )
    ).to.deep.equal({
      label: '42',
      click: 4,
      submenu: [
        { label: 'Item 1', click: 3, extra: 'abc' },
        { label: 'Item 2', click: 3, extra: 'abc' },
      ],
      extra: 'abc',
    });
  });
});
