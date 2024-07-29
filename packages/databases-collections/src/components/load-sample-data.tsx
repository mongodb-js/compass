import React from 'react';
import {
  Banner,
  Button,
  EmptyContent,
  css,
  spacing,
  Icon,
} from '@mongodb-js/compass-components';
import { LoadSampleDataZeroGraphic } from './zero-graphic';

function buildAddDataUrl(projectId: string, clusterName: string) {
  const url = new URL(
    `/v2/${projectId}#/addData/${encodeURIComponent(clusterName)}/load`,
    window.location.origin
  );
  return url.toString();
}

const addDataContainerStyles = css({
  width: '100%',
  padding: spacing[400],
});

const loadSampleDataActionsStyles = css({
  display: 'flex',
  gap: spacing[300],
});

export function LoadSampleDataZeroState({
  projectId,
  clusterName,
  canCreateDatabase,
  onCreateDatabase,
}: {
  projectId: string;
  clusterName: string;
  canCreateDatabase: boolean;
  onCreateDatabase: () => void;
}) {
  return (
    <div className={addDataContainerStyles} data-testid="add-data-zero-state">
      <EmptyContent
        icon={LoadSampleDataZeroGraphic}
        title="Looks like your cluster is empty"
        subTitle={
          canCreateDatabase ? (
            <>
              Create database or load sample data to your cluster to quickly get
              started experimenting with data in MongoDB.
            </>
          ) : (
            <>
              You can load sample data to quickly get started experimenting with
              data in MongoDB.
            </>
          )
        }
        callToActionLink={
          <div className={loadSampleDataActionsStyles}>
            {canCreateDatabase && (
              <Button variant="default" onClick={onCreateDatabase}>
                Create database
              </Button>
            )}
            <Button
              variant="primary"
              href={buildAddDataUrl(projectId, clusterName)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Load sample data
            </Button>
          </div>
        }
      />
    </div>
  );
}

const addDataBannerContent = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
});

const addDataBannerButtonStyles = css({
  marginLeft: 'auto',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
});

const EmptyElement = () => null;

export function LoadSampleDataZeroBanner({
  projectId,
  clusterName,
}: {
  projectId: string;
  clusterName: string;
}) {
  return (
    <Banner image={<EmptyElement></EmptyElement>}>
      <div className={addDataBannerContent}>
        <span>
          Working with MongoDB is easy, but first you’ll need some data to get
          started. Sample data is available for loading.
        </span>
        <div>
          <Button
            className={addDataBannerButtonStyles}
            onClick={() => {
              // Leafygreen overrides anchor tag styles inside the banner in a way
              // that completely breaks the button visuals and there is no good
              // way for us to hack around it, so instead of a link, we're using a
              // button and open a url with browser APIs
              window.open(
                buildAddDataUrl(projectId, clusterName),
                '_blank',
                'noopener noreferrer'
              );
            }}
            leftGlyph={<Icon glyph="Upload"></Icon>}
            size="small"
          >
            Load sample data
          </Button>
        </div>
      </div>
    </Banner>
  );
}
