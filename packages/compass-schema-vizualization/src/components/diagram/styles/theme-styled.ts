import { palette } from '@mongodb-js/compass-components';
import { purple30 } from '../styles/overrides';
import { hexToRgb } from '../utils/hex-to-rgb';

interface ThemeStyled {
  shared: {
    diagram: {
      background: string;
      controls: {
        background: string;
        backgroundHover: string;
        zoomText: string;
      };
      entityCard: {
        background: string;
        backgroundHover: string;
        backgroundHeader: string;
        color: string;
        border: string;
        relationalAccent: string;
        mongoDBAccent: string;
        icon: string;
        fieldType: string;
        deEmphasised: {
          backgroundHeader: string;
          colorHeader: string;
          color: string;
          fieldType: string;
          icon: string;
          relationalAccent: string;
        };
      };
      miniMap: {
        node: string;
        mask: string;
        selectionArea: string;
      };
    };
  };
}

export const DARK_THEME: ThemeStyled = {
  shared: {
    diagram: {
      background: palette.black,
      controls: {
        background: palette.gray.dark2,
        backgroundHover: palette.gray.dark1,
        zoomText: palette.gray.base,
      },
      entityCard: {
        background: palette.black,
        backgroundHeader: palette.gray.dark2,
        color: palette.gray.light2,
        backgroundHover: palette.gray.dark3,
        border: palette.gray.dark1,
        relationalAccent: purple30,
        mongoDBAccent: palette.green.base,
        icon: palette.gray.light2,
        fieldType: palette.gray.light1,
        deEmphasised: {
          backgroundHeader: palette.gray.dark3,
          colorHeader: palette.gray.base,
          color: palette.gray.dark1,
          fieldType: palette.gray.dark1,
          icon: palette.gray.dark1,
          relationalAccent: palette.gray.base,
        },
      },
      miniMap: {
        node: palette.gray.dark1,
        mask: `rgb(${hexToRgb(palette.gray.dark4)[0]},${
          hexToRgb(palette.gray.dark4)[1]
        },${hexToRgb(palette.gray.dark4)[2]}, 0.5)`,
        selectionArea: palette.black,
      },
    },
  },
};

export const THEME_LIGHT: ThemeStyled = {
  shared: {
    diagram: {
      background: palette.gray.light3,
      controls: {
        background: palette.gray.light3,
        backgroundHover: palette.gray.light2,
        zoomText: palette.gray.dark1,
      },
      entityCard: {
        background: palette.white,
        backgroundHeader: palette.gray.light2,
        color: palette.black,
        backgroundHover: palette.gray.light3,
        border: palette.gray.base,
        relationalAccent: palette.purple.base,
        mongoDBAccent: palette.green.dark1,
        icon: palette.gray.dark1,
        fieldType: palette.gray.dark1,
        deEmphasised: {
          backgroundHeader: palette.gray.light3,
          colorHeader: palette.gray.base,
          color: palette.gray.light1,
          fieldType: palette.gray.light1,
          icon: palette.gray.light1,
          relationalAccent: palette.gray.light1,
        },
      },
      miniMap: {
        node: palette.gray.light1,
        mask: `rgb(${hexToRgb(palette.gray.light2)[0]},${
          hexToRgb(palette.gray.light2)[1]
        },${hexToRgb(palette.gray.light2)[2]}, 0.6)`,
        selectionArea: palette.gray.light3,
      },
    },
  },
};
