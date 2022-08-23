import { uiColors } from '@leafygreen-ui/palette';
import { css } from '@leafygreen-ui/emotion';
import { createDataProp } from '@leafygreen-ui/lib';

export const Size = {
  XSmall: 'xsmall',
  Small: 'small',
  Normal: 'normal',
  Large: 'large',
} as const;

export type Size = typeof Size[keyof typeof Size];

interface Layout {
  borderRadius: number;
  chevron: {
    size: number;
  };
  fontSize: number;
  fontWeight: number;
  gutter: {
    vertical: number;
    horizontal: number;
  };
  height: number;
  lineHeight: number;
  minWidth: number;
}

export const layout: { readonly [K in Size]: Layout } = {
  [Size.XSmall]: {
    borderRadius: 4,
    chevron: {
      size: 2,
    },
    fontSize: 12,
    fontWeight: 600,
    gutter: {
      vertical: 2,
      horizontal: 4,
    },
    height: 22,
    lineHeight: 1,
    minWidth: 74,
  },

  [Size.Small]: {
    borderRadius: 4,
    chevron: {
      size: 2,
    },
    fontSize: 14,
    fontWeight: 600,
    gutter: {
      vertical: 2,
      horizontal: 6,
    },
    height: 25,
    lineHeight: 1,
    minWidth: 74,
  },

  [Size.Normal]: {
    borderRadius: 4,
    chevron: {
      size: 3,
    },
    fontSize: 14,
    fontWeight: 600,
    gutter: {
      vertical: 2,
      horizontal: 8,
    },
    height: 32,
    lineHeight: 1,
    minWidth: 74,
  },

  [Size.Large]: {
    borderRadius: 4,
    chevron: {
      size: 4,
    },
    fontSize: 16,
    fontWeight: 600,
    gutter: {
      vertical: 2,
      horizontal: 10,
    },
    height: 45,
    lineHeight: 1,
    minWidth: 74,
  },
} as const;

interface Color {
  color: string;
  primary: {
    backgroundColor: string;
  };
  secondary: {
    backgroundColor: string;
  };
}

export const colors: Color = {
  color: uiColors.blue.base,
  primary: {
    backgroundColor: uiColors.blue.light2,
  },
  secondary: {
    backgroundColor: uiColors.blue.light3,
  },
};

interface StateForStyles {
  size: Size;
}

export const getRootStyle = ({ size }: StateForStyles): string => {
  const { height, lineHeight } = layout[size];

  return css`
    display: flex;
    height: ${height}px;
    line-height: ${lineHeight};
  `;
};

export const getChildStyle = ({ size }: StateForStyles): string => {
  const { lineHeight } = layout[size];

  return css`
    position: relative;
    flex-direction: row;
    line-height: ${lineHeight};
    align-items: center;
    justify-content: center;
  `;
};

export const getChevronStyle = ({ size }: StateForStyles): string => {
  const { gutter, height, chevron } = layout[size];
  const width = height / 2 + chevron.size * 2;
  const offset = width;

  return css`
    margin-left: ${gutter.horizontal * 2}px;
    width: ${width}px;
    height: 100%;
    position: absolute;
    right: -${offset}px;
    top: 0;
    overflow: hidden;
    align-self: center;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      transform-origin: 0 0;
      transform: rotate(45deg);
    }
  `;
};

/* LeafyGreen Data attributes */

// Pipeline
export const pipelineAttr = createDataProp('pipeline');
export const pipelineStages = createDataProp('pipeline-stages');

// Stage
export const stageAttr = createDataProp('pipeline-stage');
export const stageChevronAttr = createDataProp('pipeline-stage-chevron');

// Counter
export const counterAttr = createDataProp('pipeline-counter');
export const counterChevronAttr = createDataProp('pipeline-counter-chevron');
