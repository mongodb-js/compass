import React from 'react';

import {
  Button,
  ButtonSize,
  ButtonVariant,
  Subtitle,
  H3,
  Body,
  Link,
  spacing,
  palette,
  css,
  cx,
  useDarkMode,
  Icon,
} from '@mongodb-js/compass-components';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { useConnectionActions } from '@mongodb-js/compass-connections/provider';
import { usePreference } from 'compass-preferences-model/provider';

const sectionContainerStyles = css({
  margin: 0,
  padding: spacing[4],
  paddingBottom: 0,
  maxWidth: '450px',
  borderRadius: spacing[200],
});

const atlasContainerStyles = css({
  backgroundColor: palette.green.light3,
  border: `1px solid ${palette.green.light2}`,
  paddingBottom: spacing[600],
});

const atlasContainerDarkModeStyles = css({
  backgroundColor: palette.green.dark3,
  borderColor: palette.green.dark2,
});

const titleStyles = css({
  fontSize: '14px',
});

const descriptionStyles = css({
  marginTop: spacing[2],
});

const createClusterContainerStyles = css({
  marginTop: spacing[2],
});

const createClusterButtonStyles = css({
  fontWeight: 'bold',
});

const createClusterButtonLightModeStyles = css({
  background: palette.white,
  '&:hover': {
    background: palette.white,
  },
  '&:focus': {
    background: palette.white,
  },
});

function AtlasHelpSection(): React.ReactElement {
  const track = useTelemetry();
  const darkMode = useDarkMode();

  return (
    <div
      className={cx(
        sectionContainerStyles,
        atlasContainerStyles,
        darkMode && atlasContainerDarkModeStyles
      )}
    >
      <Subtitle className={titleStyles}>
        New to Compass and don&apos;t have a cluster?
      </Subtitle>
      <Body className={descriptionStyles}>
        If you don&apos;t already have a cluster, you can create one for free
        using{' '}
        <Link href="https://www.mongodb.com/atlas/database" target="_blank">
          MongoDB Atlas
        </Link>
      </Body>
      <div className={createClusterContainerStyles}>
        <Button
          data-testid="atlas-cta-link"
          className={cx(
            createClusterButtonStyles,
            !darkMode && createClusterButtonLightModeStyles
          )}
          onClick={() => track('Atlas Link Clicked', { screen: 'connect' })}
          variant={ButtonVariant.PrimaryOutline}
          href="https://www.mongodb.com/cloud/atlas/lp/try4?utm_source=compass&utm_medium=product&utm_content=v1"
          target="_blank"
          size={ButtonSize.Small}
        >
          CREATE FREE CLUSTER
        </Button>
      </div>
    </div>
  );
}

const welcomeTabStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto',
  gap: spacing[200],
});

const firstConnectionBtnStyles = css({
  margin: `${spacing[400]}px 0`,
});

function WelcomeImage() {
  return (
    <svg
      width="298"
      height="198"
      viewBox="0 0 298 198"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M242.877 47.8056C238.507 32.8626 224.691 21.946 208.321 21.946C195.037 21.946 183.437 29.1352 177.197 39.8325C176.159 39.7129 175.108 39.6464 174.038 39.6464C159.044 39.6464 146.892 51.7856 146.892 66.7618C146.892 81.7381 159.044 93.8772 174.038 93.8772H242.737C255.469 93.8772 265.792 83.5652 265.792 70.8481C265.792 58.1309 255.549 47.8987 242.877 47.8189V47.8056Z"
        fill="black"
      />
      <path
        d="M242.877 39.1482C238.507 24.2052 224.691 13.2886 208.321 13.2886C195.037 13.2886 183.437 20.4777 177.197 31.175C176.159 31.0554 175.108 30.989 174.038 30.989C159.044 30.989 146.892 43.1281 146.892 58.1043C146.892 73.0806 159.044 85.2197 174.038 85.2197H242.737C255.469 85.2197 265.792 74.9078 265.792 62.1906C265.792 49.4734 255.549 39.2412 242.877 39.1615V39.1482Z"
        fill="white"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M139.229 89.2661H47.6801C39.1351 89.2661 32.208 96.1854 32.208 104.721V104.727C32.208 113.263 39.1351 120.182 47.6801 120.182H139.229C147.774 120.182 154.701 113.263 154.701 104.727V104.721C154.701 96.1854 147.774 89.2661 139.229 89.2661Z"
        fill="white"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M96.9497 103.06H47.0812C46.1591 103.06 45.4116 103.806 45.4116 104.727C45.4116 105.648 46.1591 106.395 47.0812 106.395H96.9497C97.8717 106.395 98.6193 105.648 98.6193 104.727C98.6193 103.806 97.8717 103.06 96.9497 103.06Z"
        fill="white"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M109.023 123.664C121.947 142.806 147.962 147.856 167.133 134.946C186.296 122.036 191.352 96.05 178.427 76.9011C165.503 57.7589 139.488 52.7093 120.317 65.6191C101.154 78.529 96.0983 104.515 109.023 123.664Z"
        fill="white"
      />
      <path
        d="M174.463 104.721C174.463 93.4785 165.25 84.2761 153.995 84.2761H105.058C99.8765 96.794 100.874 111.591 109.029 123.664C109.375 124.175 109.734 124.68 110.1 125.172H154.002C165.257 125.172 174.47 115.969 174.47 104.727L174.463 104.721Z"
        fill="#FFC010"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M194.06 184.087C194.06 184.087 195.596 186.293 201.157 182.432C206.718 178.565 205.175 176.36 205.175 176.36L180.45 141.151C180.45 141.151 178.401 139.497 173.446 142.939C168.49 146.387 169.335 148.879 169.335 148.879L194.06 184.087Z"
        fill="white"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M205.175 176.36L180.45 141.151C180.45 141.151 178.401 139.497 173.446 142.939C168.969 146.055 169.228 148.387 169.315 148.812C174.25 145.39 176.293 147.045 176.293 147.045L201.017 182.253C201.017 182.253 201.064 182.326 201.117 182.459C201.13 182.452 201.144 182.439 201.157 182.432C206.718 178.565 205.175 176.36 205.175 176.36Z"
        fill="black"
      />
      <path
        d="M169.82 150.992C169.82 150.992 172.168 152.606 177.516 148.998C182.871 145.391 182.252 142.613 182.252 142.613L175.62 132.793C175.62 132.793 174.224 134.507 169.76 137.517C165.297 140.527 163.182 141.171 163.182 141.171L169.813 150.992H169.82Z"
        fill="white"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M117.97 66.1041C139.375 51.6793 168.437 57.327 182.878 78.7083C197.319 100.09 191.665 129.119 170.259 143.543C148.854 157.968 119.792 152.32 105.351 130.939C90.9101 109.558 96.5641 80.5289 117.97 66.1041ZM109.415 128.202C122.34 147.344 148.355 152.394 167.525 139.484C186.689 126.574 191.745 100.588 178.82 81.4391C165.896 62.2969 139.881 57.2473 120.71 70.1571C101.546 83.067 96.491 109.053 109.415 128.202Z"
        fill="black"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M117.584 61.566C138.989 47.1413 168.051 52.7889 182.492 74.1702C196.933 95.5516 191.279 124.581 169.874 139.005C148.468 153.43 119.406 147.782 104.965 126.401C90.5244 105.02 96.1784 75.9908 117.584 61.566ZM109.03 123.664C121.954 142.806 147.969 147.855 167.14 134.946C186.303 122.036 191.359 96.0499 178.434 76.901C165.51 57.7588 139.495 52.7092 120.324 65.619C101.161 78.5289 96.1052 104.515 109.03 123.664Z"
        fill="#00F04C"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M117.584 61.566C138.989 47.1413 168.051 52.7889 182.492 74.1702C196.933 95.5516 191.279 124.581 169.874 139.005C148.468 153.43 119.406 147.782 104.965 126.401C90.5244 105.02 96.1784 75.9908 117.584 61.566ZM109.03 123.664C121.954 142.806 147.969 147.855 167.14 134.946C186.303 122.036 191.359 96.0499 178.434 76.901C165.51 57.7588 139.495 52.7092 120.324 65.619C101.161 78.5289 96.1052 104.515 109.03 123.664Z"
        fill="#00F04C"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M172.361 137.444L179.332 147.736C179.332 147.736 182.698 144.892 182.306 142.56L176.472 133.949L172.361 137.437V137.444Z"
        fill="black"
      />
      <path
        d="M154.787 102.521H110.36C109.14 102.521 108.151 103.509 108.151 104.727C108.151 105.946 109.14 106.933 110.36 106.933H154.787C156.007 106.933 156.995 105.946 156.995 104.727C156.995 103.509 156.007 102.521 154.787 102.521Z"
        fill="white"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function WelcomeTab() {
  const { createNewConnection } = useConnectionActions();
  const enableCreatingNewConnections = usePreference(
    'enableCreatingNewConnections'
  );

  return (
    <div className={welcomeTabStyles}>
      <div>
        <WelcomeImage />
      </div>
      <div>
        <H3>Welcome to MongoDB Compass</H3>
        {enableCreatingNewConnections ? (
          <>
            <Body>To get started, connect to an existing server or</Body>
            <Button
              className={firstConnectionBtnStyles}
              data-testid="add-new-connection-button"
              variant={ButtonVariant.Primary}
              leftGlyph={<Icon glyph="Plus" />}
              onClick={createNewConnection}
            >
              Add new connection
            </Button>
            <AtlasHelpSection />
          </>
        ) : (
          <Body>To get started, connect to an existing server</Body>
        )}
      </div>
    </div>
  );
}
