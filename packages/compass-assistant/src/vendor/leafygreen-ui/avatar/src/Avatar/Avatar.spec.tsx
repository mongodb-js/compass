import React from 'react';
import sample from 'lodash/sample';

import { Avatar } from './Avatar';
import { Format } from './Avatar.types';

describe('packages/Avatar', () => {
  // eslint-disable-next-line jest/no-disabled-tests
  test.skip('TypeScript', () => {
    /**
     * LOGO FORMAT
     */
    // Requires no additional props
    <Avatar format="mongodb" />;
    // Accepts (but ignores) `text` prop;
    <Avatar format="mongodb" text="AT" />;
    // Accepts (but ignores) null `text` prop;
    <Avatar format="mongodb" text={null} />;
    // Accepts (but ignores) `glyph` prop;
    <Avatar format="mongodb" glyph="PersonGroup" />;

    /**
     * ICON FORMAT
     */
    // Requires no additional props
    <Avatar format="icon" />;
    // Accepts glyph prop
    <Avatar format="icon" glyph="PersonGroup" />;
    // @ts-expect-error - Does not accept arbitrary glyph string
    <Avatar format="icon" glyph="NotAnIcon" />;
    // Accepts (but ignores) `text` prop;
    <Avatar format="icon" text="AT" />;
    // Accepts (but ignores) null `text` prop;
    <Avatar format="icon" text={null} />;

    /**
     * TEXT FORMAT
     */
    // @ts-expect-error - Requires `text` prop
    <Avatar format="text" />;
    // Accepts null text prop
    <Avatar format="text" text={null} />;
    // Accepts text prop
    <Avatar format="text" text="AT" />;
    // Accepts (but ignores) `glyph` prop;
    <Avatar format="text" text="AT" glyph="PersonGroup" />;

    /**
     * Indeterminate format
     */

    const arbitraryFormat: Format = sample([
      Format.Icon,
      Format.MongoDB,
      Format.Text,
    ]) as Format;

    // @ts-expect-error - requires defined text prop
    <Avatar format={arbitraryFormat} />;
    // Accepts null text prop
    <Avatar format={arbitraryFormat} text={null} />;
    // Accepts text prop
    <Avatar format={arbitraryFormat} text="AT" />;
    // Accepts glyph prop
    <Avatar format={arbitraryFormat} text="AT" glyph="PersonGroup" />;
  });
});
