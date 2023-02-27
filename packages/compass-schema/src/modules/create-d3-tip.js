import { css, palette } from '@mongodb-js/compass-components';
import d3 from 'd3';
require('./d3-tip')(d3);

const toolTipStyles = (darkMode) => css`
  z-index: 5;
  line-height: 1;
  padding: 8px;
  background: ${darkMode ? palette.white : palette.black};
  color: ${darkMode ? palette.black : palette.white};
  border-radius: 5px;
  pointer-events: none;
  font-size: 12px;

  &:after {
    content: '\\25BC';
    display: block;
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 16px;
    line-height: 1;
    color: ${darkMode ? palette.white : palette.black};
  }
`;

const toolTipStylesDark = toolTipStyles(true);
const toolTipStylesLight = toolTipStyles(false);

const createD3Tip = () => {
  const isDarkTheme = !!document.querySelector('[data-theme="Dark"]');
  return d3
    .tip()
    .attr('class', isDarkTheme ? toolTipStylesDark : toolTipStylesLight)
    .direction('n')
    .offset([-9, 0]);
};

export { createD3Tip };
