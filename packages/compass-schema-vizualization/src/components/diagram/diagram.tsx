import React from 'react';
import { Canvas } from './canvas/canvas';
import { ThemeProvider } from 'styled-components';
import { DARK_THEME, THEME_LIGHT } from './styles/theme-styled';
import type { ComponentProps } from 'react';

interface Props extends ComponentProps<typeof Canvas> {
  isDarkMode?: boolean;
}

export const Diagram = ({ isDarkMode, ...rest }: Props) => {
  return (
    <ThemeProvider theme={isDarkMode ? DARK_THEME : THEME_LIGHT}>
      <Canvas {...rest} />
    </ThemeProvider>
  );
};
