import React, { useEffect, useRef } from 'react';
import { spacing, css, palette, rgba } from '@mongodb-js/compass-components';

const animationContainerStyles = css({
  marginTop: spacing[3],
  textAlign: 'center',
});

const animationSvgStyles = css({
  width: 70,
  height: 'auto',
});

const shadowStyles = css({
  fill: palette.green.dark2,
  opacity: 0.12,
});

const ringCircleStyles = css({
  stroke: palette.green.dark2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  fill: 'none',
});

const ringShadowStyles = css(ringCircleStyles, {
  opacity: 0.12,
});

const innerCircleStyles = css({
  fill: palette.yellow.light3,
  opacity: 0.85,
});

const outerCircleStyles = css({
  fill: palette.red.light2,
});

const redArrowStyles = css({
  fill: palette.red.light1,
});

const arrowStyles = css({
  fill: rgba(palette.green.dark2, 0.3),
});

// This function returns the speed at which the needle shoots off in
// a direction. The farther from 0 the number, the farther/faster it goes.
const getNewRotationVelocity = () => {
  return (
    (Math.PI / (170 + Math.random() * 100)) * (Math.random() > 0.5 ? 1 : -1)
  );
};

// How fast the needle returns to the center mark.
const rotationAcceleration = Math.PI / 90000;
// Closer to 0 the more friction/slowdown overtime there is (1 is no friction).
const friction = 0.974;

/**
 * Animated compass shown when attempting to connect.
 */
function ConnectingAnimation(): React.ReactElement {
  const requestAnimationRef =
    useRef<ReturnType<typeof window.requestAnimationFrame>>();
  const lastFrame = useRef<number>(Date.now());
  const currentRotation = useRef<number>(0);
  const rotationVelocity = useRef<number>(getNewRotationVelocity());

  const connectingArrow1Ref = useRef<SVGPolygonElement>(null);
  const connectingArrow2Ref = useRef<SVGPolygonElement>(null);

  useEffect(() => {
    function updateAnimation() {
      if (Date.now() - lastFrame.current > 20) {
        // When the user returns from an unfocused view we disregard
        // that last frame time for a frame.
        lastFrame.current = Date.now();
      }

      const deltaTime = Date.now() - lastFrame.current;

      const arrow1 = connectingArrow1Ref.current;
      const rotation = currentRotation.current * (180 / Math.PI);
      arrow1?.setAttribute('transform', `rotate(${rotation}, 24.39, 39.2)`);
      const arrow2 = connectingArrow2Ref.current;
      arrow2?.setAttribute('transform', `rotate(${rotation}, 24.39, 39.2)`);

      currentRotation.current += rotationVelocity.current * deltaTime;
      rotationVelocity.current +=
        rotationAcceleration *
        (currentRotation.current > 0 ? -1 : 1) *
        deltaTime;
      rotationVelocity.current *= friction;

      if (
        Math.abs(rotationVelocity.current) < Math.PI / 1100 &&
        Math.abs(currentRotation.current) < Math.PI / 1100
      ) {
        // When the Compass hands are settled we apply a force so
        // it starts to rotate again.
        rotationVelocity.current = getNewRotationVelocity();
      }

      lastFrame.current = Date.now();

      requestAnimationRef.current =
        window.requestAnimationFrame(updateAnimation);
    }

    requestAnimationRef.current = window.requestAnimationFrame(updateAnimation);
    return () => {
      if (requestAnimationRef.current !== undefined) {
        window.cancelAnimationFrame(requestAnimationRef.current);
      }
    };
  }, []);

  return (
    <div className={animationContainerStyles}>
      <svg
        className={animationSvgStyles}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 50.82 64.05"
      >
        <g>
          <circle className={ringShadowStyles} cx="26.15" cy="9.86" r="8.47" />
          <circle className={ringCircleStyles} cx="24.39" cy="9.86" r="8.47" />
          <circle className={shadowStyles} cx="26.15" cy="39.2" r="24.38" />
          <circle
            className={outerCircleStyles}
            cx="24.39"
            cy="39.2"
            r="24.39"
          />
          <circle
            className={innerCircleStyles}
            cx="24.39"
            cy="39.37"
            r="20.1"
          />

          <polygon
            ref={connectingArrow1Ref}
            className={redArrowStyles}
            points="24.39 22.62 21.35 39.2 27.43 39.2 24.39 22.62"
          />
          <polygon
            ref={connectingArrow2Ref}
            className={arrowStyles}
            points="24.39 55.77 27.43 39.2 21.35 39.2 24.39 55.77"
          />
        </g>
      </svg>
    </div>
  );
}

export default ConnectingAnimation;
