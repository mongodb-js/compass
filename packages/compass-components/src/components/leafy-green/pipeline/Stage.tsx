/* eslint-disable filename-rules/match */

import type { ReactNode, Ref, ReactElement } from 'react';
import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { mergeRefs } from 'react-merge-refs';
import { useInView } from 'react-intersection-observer';
import { css, cx } from '@leafygreen-ui/emotion';
import { uiColors } from '@leafygreen-ui/palette';
import {
  getRootStyle,
  getChildStyle,
  getChevronStyle,
  Size,
  layout,
  colors,
  stageAttr,
  stageChevronAttr,
} from './styles';

interface StateForStyles {
  size?: Size;
}

export interface StageProps {
  /**
   * Content that will appear inside of the Stage component.
   **/
  children: ReactNode;

  /**
   * Classname applied to Stage content container.
   **/
  className?: string;

  /**
   * The DOM node to use as the root node for the intersectionObserver. Defaults to window when null or undefined.
   **/
  intersectionNode?: HTMLElement | null;

  /**
   * Alter the rendered size of the component. Inherited from the parent Pipeline component.
   */
  size?: Size;

  /**
   * Either a single number or an array of numbers which indicate at what percentage of the target's visibility
   * the observer's callback should be executed.
   */
  threshold?: number | Array<number>;
}

const getBaseStyle = ({ size = Size.XSmall }: StateForStyles): string => {
  const {
    borderRadius,
    chevron,
    fontSize,
    fontWeight,
    gutter,
    height,
    lineHeight,
  } = layout[size];

  const { color, primary } = colors;
  const outerSize = height / 2;
  const offset = outerSize + chevron.size * 2;

  return cx(
    getRootStyle({ size }),
    getChildStyle({ size }),
    css`
      background-color: ${primary.backgroundColor};
      color: ${color};
      padding: ${gutter.vertical}px ${gutter.horizontal}px;
      margin-right: ${offset}px;
      font-size: ${fontSize}px;
      font-weight: ${fontWeight};
      line-height: ${lineHeight};
      flex: 1 1 auto;
      white-space: nowrap;
      z-index: 1;

      &:first-of-type {
        border-top-left-radius: ${borderRadius}px;
        border-bottom-left-radius: ${borderRadius}px;
      }

      &[data-stage-visible='false'] {
        counter-increment: hiddenCount;
      }
    `
  );
};

const getStageChevronStyle = ({
  size = Size.XSmall,
}: StateForStyles): string => {
  const { chevron, height } = layout[size];
  const { primary } = colors;
  const outerSize = height / 2;

  return cx(
    getChevronStyle({ size }),
    css`
      &::before {
        background-color: ${primary.backgroundColor};
        box-shadow: 0 0 0 ${chevron.size}px ${uiColors.white},
          0 0 0 ${outerSize}px ${primary.backgroundColor};
      }
    `
  );
};

const getStatefulStyles = (state: StateForStyles) => ({
  base: getBaseStyle(state),
  chevron: getStageChevronStyle(state),
});

/**
 * # Stage
 *
 * React Component to render an individual MongoDB Aggregation stage.
 * To be used in conjunction with Pipeline component as a child.
 *
 * ```
 * <Pipeline>
 *   <Stage>$match</Stage>
 *   <Stage>$addFields</Stage>
 *   <Stage>$limit</Stage>
 * </Pipeline>
 * ```
 * @param props.children Content that will appear inside of the Stage component.
 * @param props.className Classname applied to Stage content container.
 * @param props.intersectionNode The DOM node to use as the root node for the intersectionObserver. Defaults to window when null or undefined.
 * @param props.size Alters the rendered size of the component.
 * @param props.threshold Either a single number or an array of numbers which indicate at what percentage of the target's visibility the observer's callback should be executed.
 * @param props.variant Alters the visual appearance of the component.
 */
const Stage = forwardRef(
  (
    {
      children,
      className = '',
      intersectionNode,
      size,
      threshold = 0.8,
      ...rest
    }: StageProps,
    ref: Ref<HTMLLIElement>
  ): ReactElement => {
    // Effects
    const [setRef, isVisible] = useInView({
      threshold,
      root: intersectionNode,
    });

    const { base: baseStyle, chevron: chevronStyle } = getStatefulStyles({
      size,
    });

    return (
      <li
        {...rest}
        {...stageAttr.prop}
        ref={mergeRefs([setRef, ref])}
        data-testid="pipeline-stage"
        data-stage-visible={isVisible}
        className={cx(baseStyle, className)}
      >
        {children}

        <div
          data-testid="pipeline-stage-chevron"
          {...stageChevronAttr.prop}
          className={chevronStyle}
        />
      </li>
    );
  }
);

Stage.displayName = 'Stage';

Stage.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  intersectionNode: PropTypes.any, // eslint-disable-line react/forbid-prop-types
  size: PropTypes.oneOf(Object.values(Size)),
  threshold: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.arrayOf(PropTypes.number.isRequired),
  ]),
};

export default Stage;
