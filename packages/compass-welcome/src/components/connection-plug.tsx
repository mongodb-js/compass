import React, { useMemo, useState, useLayoutEffect, useRef } from 'react';
import { useConnectionIds } from '@mongodb-js/compass-connections/provider';

const CONNECT_ANIMATION_DURATION_MS = 500;
const DISCONNECT_ANIMATION_DURATION_MS = 200;

// Only animate the sparks over last % of connection animation.
const SPARK_DURATION_PERCENTAGE_OF_TOTAL = 0.35;
const SPARK_TRAVEL_DISTANCE = 44; // pixels

const pluginDirection = Math.PI * (14.63 / 8);
const inversePluginDirection = pluginDirection + Math.PI;

const DISTANCE_TO_MOVE = 29.7;

function useIsAConnectionConnected() {
  const connectedConnectionIds = useConnectionIds(
    (connection) => connection.status === 'connected'
  );
  const isConnected = useMemo(
    () => connectedConnectionIds.length > 0,
    [connectedConnectionIds]
  );
  return isConnected;
}

// Easing function for smoother animation, the slight pull back and accelerate.
function easeWithSpring(t: number): number {
  return t * t * (5.7 * t - 4.7);
}

const LIGHTNING_COLOR = '#FFE212';
const LIGHTNING_STROKE_COLOR = '#8a7b0bff';

function LightningSparks({
  offsetX,
  offsetY,
  rotation,
  sparkOffsetDirection,
  sparkOffsetAmount,
  scale,
}: {
  offsetX: number;
  offsetY: number;
  rotation: number;
  sparkOffsetDirection: number;
  sparkOffsetAmount: number;
  scale: number;
}) {
  const sparkOffsetX =
    offsetX + Math.cos(sparkOffsetDirection) * sparkOffsetAmount;
  const sparkOffsetY =
    offsetY + Math.sin(sparkOffsetDirection) * sparkOffsetAmount;

  return (
    <g
      transform={`translate(${sparkOffsetX}, ${sparkOffsetY}) rotate(${rotation})`}
    >
      <g transform={`scale(${scale})`}>
        {/* Main lightning bolt - centered around 0,0 */}
        <path
          d="M-8 -10 L4 2 L-2 2 L8 12 L-6 4 L0 4 Z"
          fill={LIGHTNING_COLOR}
          stroke={LIGHTNING_STROKE_COLOR}
          strokeWidth="0.8"
        />

        {/* Secondary smaller lightning bolts */}
        <path
          d="M6 -16 L14 -6 L10 -6 L18 0 L8 -4 L12 -4 Z"
          fill={LIGHTNING_COLOR}
          stroke={LIGHTNING_STROKE_COLOR}
          strokeWidth="0.5"
          opacity="0.8"
        />
        <path
          d="M-18 6 L-8 14 L-12 14 L-4 20 L-14 16 L-10 16 Z"
          fill={LIGHTNING_COLOR}
          stroke={LIGHTNING_STROKE_COLOR}
          strokeWidth="0.5"
          opacity="0.7"
        />
      </g>
    </g>
  );
}

// Shows a plug that animates through the connection process.
export function ConnectionPlug() {
  const isConnected = useIsAConnectionConnected();
  const animationFrameRef = useRef<number | null>(null);

  // 0 = disconnected/animation start, 1 = connected/animation complete.
  const [animationProgress, setAnimationProgress] = useState(
    isConnected ? 1 : 0
  );

  useLayoutEffect(() => {
    const cancelOngoingAnimation = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    if (isConnected) {
      cancelOngoingAnimation();
      const animationStartTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - animationStartTime;
        const rawProgress = Math.min(
          elapsed / CONNECT_ANIMATION_DURATION_MS,
          1
        );
        const easedProgress = easeWithSpring(rawProgress);

        setAnimationProgress((currentProgress) =>
          currentProgress >= 0.99999 ? currentProgress : easedProgress
        );

        if (rawProgress < 0.99999) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    } else if (!isConnected) {
      cancelOngoingAnimation();
      // Quick disconnect animation.
      const animationStartTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - animationStartTime;
        const rawProgress = Math.min(
          elapsed / DISCONNECT_ANIMATION_DURATION_MS,
          1
        );
        const newProgress = 1 - rawProgress;

        if (rawProgress > 0.000001) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }

        setAnimationProgress((currentProgress) =>
          currentProgress <= 0.000001 ? currentProgress : newProgress
        );
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return cancelOngoingAnimation;
  }, [isConnected]);

  const leftPlugOffsetX =
    animationProgress * DISTANCE_TO_MOVE * Math.cos(pluginDirection);
  const leftPlugOffsetY =
    animationProgress * DISTANCE_TO_MOVE * Math.sin(pluginDirection);

  const rightPlugOffsetX =
    animationProgress * DISTANCE_TO_MOVE * Math.cos(inversePluginDirection);
  const rightPlugOffsetY =
    animationProgress * DISTANCE_TO_MOVE * Math.sin(inversePluginDirection);

  const sparkAnimationProgress = Math.min(
    Math.max(
      (animationProgress - (1 - SPARK_DURATION_PERCENTAGE_OF_TOTAL)) /
        SPARK_DURATION_PERCENTAGE_OF_TOTAL,
      0
    ),
    1
  );

  // Spark appears when animation is nearly complete and fades out.
  const sparkOpacity =
    isConnected && animationProgress > 1 - SPARK_DURATION_PERCENTAGE_OF_TOTAL
      ? (() => {
          const fadeInProgress = sparkAnimationProgress * 5;
          const fadeOutProgress = Math.pow(1 - sparkAnimationProgress, 4);

          return fadeInProgress * fadeOutProgress * 5;
        })()
      : 0;

  const sparkScale = sparkAnimationProgress * 1.5;
  const sparkOffsetAmount =
    sparkAnimationProgress * sparkAnimationProgress * SPARK_TRAVEL_DISTANCE;

  return (
    <svg
      className="darkreader-ignore-child-inline-style"
      data-testid="connection-plug-svg"
      width="298"
      height="198"
      viewBox="0 0 448 298"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background. */}
      <path
        d="M313.02 232.35C313.02 209.35 331.69 190.67 354.7 190.67C377.71 190.67 396.38 172 396.38 148.99V65.6502C396.38 42.6502 377.71 23.9702 354.7 23.9702C331.69 23.9702 313.02 42.6402 313.02 65.6502C313.02 88.6602 294.35 107.33 271.34 107.33H187.99C164.99 107.33 146.31 126 146.31 149.01C146.31 172.02 127.64 190.69 104.63 190.69C81.6202 190.69 62.9502 209.36 62.9502 232.37C62.9502 255.38 81.6202 274.05 104.63 274.05H271.33C294.33 274.05 313.01 255.38 313.01 232.37L313.02 232.35Z"
        fill="#E3FCF7"
      />

      {/* Wire bases */}
      <path
        d="M89.8202 186.92C98.8611 186.92 106.19 179.591 106.19 170.55C106.19 161.509 98.8611 154.18 89.8202 154.18C80.7793 154.18 73.4502 161.509 73.4502 170.55C73.4502 179.591 80.7793 186.92 89.8202 186.92Z"
        fill="black"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M361.32 171.49C370.361 171.49 377.69 164.161 377.69 155.12C377.69 146.079 370.361 138.75 361.32 138.75C352.279 138.75 344.95 146.079 344.95 155.12C344.95 164.161 352.279 171.49 361.32 171.49Z"
        fill="black"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M360.95 164.37C369.991 164.37 377.32 157.041 377.32 148C377.32 138.959 369.991 131.63 360.95 131.63C351.909 131.63 344.58 138.959 344.58 148C344.58 157.041 351.909 164.37 360.95 164.37Z"
        fill="#FFE212"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M360.95 155.66C365.181 155.66 368.61 152.23 368.61 148C368.61 143.769 365.181 140.34 360.95 140.34C356.72 140.34 353.29 143.769 353.29 148C353.29 152.23 356.72 155.66 360.95 155.66Z"
        fill="black"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M89.4403 179.8C98.4812 179.8 105.81 172.47 105.81 163.43C105.81 154.389 98.4812 147.06 89.4403 147.06C80.3994 147.06 73.0703 154.389 73.0703 163.43C73.0703 172.47 80.3994 179.8 89.4403 179.8Z"
        fill="#FFE212"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M89.4403 171.09C93.6708 171.09 97.1003 167.661 97.1003 163.43C97.1003 159.2 93.6708 155.77 89.4403 155.77C85.2098 155.77 81.7803 159.2 81.7803 163.43C81.7803 167.661 85.2098 171.09 89.4403 171.09Z"
        fill="black"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right plug wire */}
      <path
        d={`M363.88 150.97L411.3 123.59C427.27 114.37 432.74 93.9598 423.52 77.9898L420.41 72.6098C411.19 56.6398 390.78 51.1698 374.81 60.3898L${
          256.48 + rightPlugOffsetX
        } ${128.71 + rightPlugOffsetY}L${260.83 + rightPlugOffsetX} ${
          136.24 + rightPlugOffsetY
        }L379.16 67.9198C390.97 61.0998 406.07 65.1498 412.88 76.9598L415.99 82.3398C422.81 94.1498 418.76 109.25 406.95 116.06L359.53 143.44C358.19 144.22 357.36 145.65 357.36 147.2C357.36 150.55 360.98 152.64 363.88 150.96V150.97Z`}
        fill="#FFE212"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Left plug sockets, we want these to hide behind the right plug */}
      <g transform={`translate(${leftPlugOffsetX}, ${leftPlugOffsetY})`}>
        <path
          d="M211.184 145.864L209.204 142.434L198.76 148.464L200.74 151.894L211.184 145.864Z"
          fill="black"
          stroke="black"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M225.221 170.178L223.241 166.748L212.797 172.778L214.777 176.208L225.221 170.178Z"
          fill="black"
          stroke="black"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Right plug - the parts we to cover the left sockets */}
      <g transform={`translate(${rightPlugOffsetX}, ${rightPlugOffsetY})`}>
        <path
          d="M262.886 173.028C272.299 167.594 271.64 148.831 261.414 131.119C251.189 113.408 235.269 103.456 225.856 108.89C216.443 114.325 217.102 133.088 227.328 150.799C237.553 168.511 253.473 178.463 262.886 173.028Z"
          fill="white"
          stroke="black"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M299.33 149.41C298.85 149.69 298.36 149.93 297.86 150.16L274.69 163.54L266.63 127.66L239.67 102.88L262.84 89.4996C263.29 89.1796 263.75 88.8796 264.23 88.5996C274.44 82.6996 288.67 87.5596 298.67 99.4296L301.08 98.0396C305.15 95.6896 310.35 97.0896 312.7 101.15C315.05 105.22 313.65 110.42 309.59 112.77L307.18 114.16C312.46 128.75 309.55 143.5 299.34 149.4L299.33 149.41Z"
          fill="#00ED64"
          stroke="black"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M278.861 120.6C271.071 107.11 259.991 98.0395 250.731 96.4995L238.471 103.58L240.561 105.73C248.811 106.72 259.131 115.15 266.421 127.79C273.071 139.3 275.431 151.24 273.331 159.05L274.691 163.55L285.571 157.27C289.011 148.5 286.721 134.23 278.861 120.61V120.6Z"
          fill="black"
          stroke="black"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M263.23 173.79C253.3 179.52 236.69 169.34 226.13 151.05C215.57 132.76 215.06 113.28 224.98 107.55L234.88 101.84C244.81 96.1098 261.42 106.29 271.98 124.58C282.54 142.87 283.05 162.35 273.13 168.08L263.23 173.79ZM262.15 171.92C271.1 166.75 270.28 148.57 260.31 131.3C250.34 114.04 235.01 104.23 226.05 109.4C217.1 114.57 217.92 132.75 227.89 150.02C237.86 167.28 253.19 177.09 262.15 171.92Z"
          fill="#00ED64"
          stroke="black"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M301.531 97.7798C306.901 99.9198 310.831 107.39 310.041 112.51L306.941 114.3C305.731 110.41 301.851 103.66 298.431 99.5698L301.531 97.7798Z"
          fill="black"
          stroke="black"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M309.5 97.8897L312.49 96.1597C312.49 96.1597 314.2 96.6297 315.74 99.2997C317.28 101.97 316.96 103.61 316.96 103.61L313.84 105.41C313.84 105.41 314.12 103.8 312.62 101.2C311.12 98.5997 309.49 97.8797 309.49 97.8797L309.5 97.8897Z"
          fill="black"
          stroke="black"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M250.171 131.84L254.791 139.84C254.791 139.84 249.941 141.99 247.911 138.48C245.881 134.97 250.171 131.84 250.171 131.84Z"
          fill="black"
          stroke="black"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M240.074 129.072L238.094 125.642L227.649 131.672L229.629 135.102L240.074 129.072Z"
          fill="black"
          stroke="black"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M254.121 153.386L252.141 149.956L241.696 155.986L243.676 159.416L254.121 153.386Z"
          fill="black"
          stroke="black"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M283.78 144.93L291.21 140.64C291.21 140.64 315.45 127.55 303.35 106.6C303.35 106.6 310.64 116.67 309.55 130.97C309.06 137.41 306.74 142.42 303.94 145.62C300.53 149.52 296.15 151.14 290.25 154.55C279.5 160.75 284.61 157.39 284.61 157.39L283.77 144.93H283.78Z"
          fill="black"
          stroke="black"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Left plug wire */}
      <path
        d={`M92.62 163.48C92.62 165 91.8 166.4 90.48 167.17L41.03 195.85C29.36 202.59 25.27 217.47 31.78 229.21C38.48 241.29 54.24 245.24 66.2 238.33L${
          122.54 + leftPlugOffsetX
        } ${205.8 + leftPlugOffsetY}L${126.89 + leftPlugOffsetX} ${
          213.33 + leftPlugOffsetY
        }L70.64 245.81C54.47 255.15 33.24 249.75 24.18 233.42C15.38 217.55 20.91 197.43 36.68 188.32L86.18 159.74C89.05 158.08 92.64 160.17 92.62 163.48Z`}
        fill="#FFE212"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Left plug - animate rightward as it connects */}
      <g transform={`translate(${leftPlugOffsetX}, ${leftPlugOffsetY})`}>
        <path
          d="M210.446 202.625C219.859 197.19 219.2 178.427 208.975 160.716C198.749 143.004 182.829 133.052 173.416 138.487C164.004 143.921 164.662 162.684 174.888 180.396C185.114 198.107 201.034 208.059 210.446 202.625Z"
          fill="white"
          stroke="black"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M210.57 203.02C220.19 197.47 219.69 178.6 209.46 160.88C199.23 143.16 183.14 133.29 173.52 138.85L163.93 144.39C154.31 149.94 154.81 168.81 165.04 186.53C175.27 204.25 191.36 214.12 200.98 208.56L210.57 203.02Z"
          fill="#00ED64"
          stroke="black"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M137.64 212.07L135.23 213.46C131.16 215.81 125.96 214.41 123.61 210.35C121.26 206.28 122.66 201.08 126.72 198.73L129.13 197.34C123.85 182.75 126.76 168 136.97 162.1C137.45 161.82 137.94 161.58 138.44 161.35L164.93 146.12C173.6 141.11 188.46 150.61 198.12 167.33C207.77 184.05 208.57 201.67 199.9 206.68L173.47 222.01C173.02 222.33 172.56 222.63 172.08 222.91C161.87 228.81 147.64 223.95 137.64 212.08V212.07Z"
          fill="#00ED64"
          stroke="black"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M119.37 207.92L122.47 206.13C122.47 206.13 124.21 206.56 125.74 209.21C127.27 211.85 126.9 213.5 126.9 213.5L123.67 215.37C123.67 215.37 123.99 213.75 122.51 211.18C121.03 208.61 119.37 207.92 119.37 207.92Z"
          fill="black"
          stroke="black"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M205.87 190.36L169.04 211.62C169.04 211.62 149.96 223.37 137.35 210.31C135.98 208.89 137.22 211.45 136.03 209.4C136.03 209.4 135.13 208.79 137.64 212.07C140.49 215.8 144.62 219.37 151.5 222.68C164.43 228.89 170.58 223.9 181.33 217.69C192.08 211.49 200.94 206.16 200.94 206.16C200.94 206.16 206.76 202.47 205.88 190.36H205.87Z"
          fill="black"
          stroke="black"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M216.87 180.8L205.54 187.34C205.54 187.34 206.54 194.21 204.85 200.22C202.57 204.98 202.8 204.94 193.94 210.04C193.7 210.11 195.89 210.54 198.89 209.49C200.13 209.05 201.64 208.11 203.19 207.22C208.46 204.18 211.98 202.03 211.98 202.03C211.98 202.03 216.13 198.49 217.12 192.13C218.07 186.05 216.87 180.8 216.87 180.8Z"
          fill="black"
          stroke="black"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M137.64 212.07L133.75 214.14C135.73 209.94 132.89 201.84 126.73 198.73L129.14 197.34C129.14 197.34 133.36 196.51 136.36 201.91C139.62 207.78 137.64 212.07 137.64 212.07Z"
          fill="black"
        />
        <path
          d="M137.64 212.07L133.75 214.14C135.73 209.94 132.89 201.84 126.73 198.73L129.14 197.34C129.14 197.34 133.36 196.51 136.36 201.91C139.62 207.78 137.64 212.07 137.64 212.07"
          stroke="black"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Spark animation - appears when plugs connect */}
      <g opacity={sparkOpacity}>
        <LightningSparks
          offsetX={200}
          offsetY={104}
          sparkOffsetDirection={pluginDirection - Math.PI / 2}
          sparkOffsetAmount={sparkOffsetAmount}
          scale={sparkScale}
          rotation={0}
        />
        <LightningSparks
          offsetX={250}
          offsetY={185}
          sparkOffsetDirection={pluginDirection + Math.PI / 2}
          sparkOffsetAmount={sparkOffsetAmount}
          scale={sparkScale}
          rotation={180}
        />
      </g>
    </svg>
  );
}
