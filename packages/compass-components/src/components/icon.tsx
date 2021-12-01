import React from 'react';
import {default as LeafyIcon, Size, createIconComponent } from '@leafygreen-ui/icon';
import { css } from '@emotion/css';
import { spacing } from '@leafygreen-ui/tokens';

const customIconWrapper = css({
  marginTop: spacing[1],
  marginLeft: spacing[1],
});

const customIcons = [
  'Mongo',
] as const;

type CustomGlyphs = typeof customIcons[number];
interface CustomIconProps {
  glyph: CustomGlyphs,
  size: Size,
  fill?: string
};
// todo: fix types
type LeafyIconProps = ReturnType<typeof createIconComponent> & {glyph: string};

const sizeMap: Record<Size, number> = {
  small: 14,
  default: 16,
  large: 20,
  xlarge: 24,
};

function getSize(size: Size | number) {
  if (typeof size === 'number') {
    return size;
  }
  return sizeMap[size] || 16;
}

function CustomIcon({glyph, size, fill}: CustomIconProps) {
  let icon;
  const fillColor = fill ?? '#FFF';
  switch(glyph) {
    case 'Mongo':
      icon = <svg width={getSize(size)} viewBox="0 0 16 16" fill={fillColor} xmlns="http://www.w3.org/2000/svg">
        <path d="M5.13893 1.784C4.46642 0.986962 3.8811 0.177466 3.76279 0.00934034C3.75033 -0.00311345 3.73165 -0.00311345 3.7192 0.00934034C3.60089 0.177466 3.02179 0.986962 2.34928 1.784C-3.42305 9.13796 3.25841 14.0946 3.25841 14.0946L3.31445 14.1319C3.36426 14.8978 3.4888 16 3.4888 16H3.73788H3.98695C3.98695 16 4.11149 14.9041 4.16131 14.1319L4.21735 14.0883C4.22358 14.0946 10.9113 9.13796 5.13893 1.784ZM3.7441 13.9887C3.7441 13.9887 3.44521 13.7334 3.36426 13.6026V13.5902L3.72542 5.58241C3.72542 5.5575 3.76279 5.5575 3.76279 5.58241L4.12394 13.5902V13.6026C4.043 13.7334 3.7441 13.9887 3.7441 13.9887Z"/>
      </svg>;
      break;
    default:
      icon = <></>;
      break;
  }
  return <div className={customIconWrapper}>{icon}</div>
}

function Icon(props: LeafyIconProps | CustomIconProps): React.ReactElement {
  if (customIcons.includes(props.glyph as CustomGlyphs)) {
    return <CustomIcon {...props as CustomIconProps} />
  }
  return <LeafyIcon {...props as LeafyIconProps} />;
}

export default Icon;