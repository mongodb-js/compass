import {
  palette,
  css,
  keyframes,
  spacing,
} from '@mongodb-js/compass-components';
import React from 'react';

export type StatusMarker =
  | 'connected'
  | 'disconnected'
  | 'connecting'
  | 'failed';
export type StatusMarkerProps = {
  status: StatusMarker;
  children: React.ReactNode;
};

function ConnectedStatusMarker(): React.ReactElement {
  return (
    <svg
      width={spacing[200]}
      height={spacing[200]}
      viewBox="0 0 8 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Connected Icon"
    >
      <circle cx="4.25" cy="4.25" r="3.5" fill={palette.green.dark1} />
    </svg>
  );
}

const connectingIconAnimation = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

export const connectingIconStyle = css`
  animation: ${connectingIconAnimation} 1.5s linear infinite;
`;

function ConnectingStatusMarker(): React.ReactElement {
  return (
    <svg
      className={connectingIconStyle}
      width={spacing[200]}
      height={spacing[200]}
      viewBox="0 0 8 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Connecting Icon"
    >
      <rect width="8" height="8" rx="4" fill="#F9FBFA" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.64712 6.14088C1.79974 6.34283 2.09302 6.34006 2.27132 6.16038C2.44962 5.9807 2.44376 5.69245 2.30279 5.48221C2.0538 5.1109 1.91667 4.67113 1.91667 4.20833C1.91667 2.94268 2.94268 1.91667 4.20833 1.91667C4.74833 1.91667 5.25651 2.10387 5.65961 2.4344C5.85535 2.5949 6.14175 2.62823 6.33763 2.4679C6.53351 2.30757 6.56426 2.0159 6.37782 1.84468C5.80668 1.32018 5.0449 1 4.20833 1C2.43642 1 1 2.43642 1 4.20833C1 4.93399 1.24091 5.60338 1.64712 6.14088Z"
        fill={palette.green.dark1}
      />
    </svg>
  );
}

function FailedStatusMarker(): React.ReactElement {
  return (
    <svg
      width={spacing[200]}
      height={spacing[200]}
      viewBox="0 0 7 6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Failed Connection Icon"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.62796 0.412185C3.46455 0.112605 3.03545 0.112605 2.87204 0.412185L0.240953 5.23572C0.0839275 5.5236 0.291686 5.875 0.618909 5.875H5.88109C6.20831 5.875 6.41607 5.5236 6.25905 5.23572L3.62796 0.412185ZM2.8125 1.9375C2.8125 1.69588 3.00838 1.5 3.25 1.5C3.49162 1.5 3.6875 1.69588 3.6875 1.9375V3.6875C3.6875 3.92912 3.49162 4.125 3.25 4.125C3.00838 4.125 2.8125 3.92912 2.8125 3.6875V1.9375ZM3.6875 5C3.6875 5.24162 3.49162 5.4375 3.25 5.4375C3.00838 5.4375 2.8125 5.24162 2.8125 5C2.8125 4.75838 3.00838 4.5625 3.25 4.5625C3.49162 4.5625 3.6875 4.75838 3.6875 5Z"
        fill={palette.red.base}
      />
    </svg>
  );
}

function NoMarker(): React.ReactElement {
  return <div style={{ width: spacing[200], height: spacing[200] }}></div>;
}

const MARKER_COMPONENTS: Record<StatusMarker, React.FunctionComponent> = {
  connected: ConnectedStatusMarker,
  connecting: ConnectingStatusMarker,
  failed: FailedStatusMarker,
  disconnected: NoMarker,
} as const;

const withStatusMarkerStyles = css({
  position: 'relative',
  display: 'flex',
});

const withStatusMarkerMarkerStyles = css({
  position: 'absolute',
  display: 'flex',
  right: `-${spacing[50]}px`,
  bottom: `-${spacing[50]}px`,
});

export function WithStatusMarker({
  status,
  children,
}: StatusMarkerProps): React.ReactElement {
  const Marker = MARKER_COMPONENTS[status];
  return (
    <div className={withStatusMarkerStyles}>
      {children}
      <span className={withStatusMarkerMarkerStyles}>
        <Marker />
      </span>
    </div>
  );
}
