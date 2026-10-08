import React from 'react';

import {
  css,
  palette,
  spacing,
  Body,
  useDarkMode,
  Subtitle,
  useTranslation,
} from '@mongodb-js/compass-components';

const centeredContent = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: spacing[400],
  flexDirection: 'column',
  textAlign: 'center',
});

const missingAtlasIndexLightStyles = css({
  color: palette.green.dark2,
});

const missingAtlasIndexDarkStyles = css({
  color: palette.green.base,
});

export default function SearchNoResults() {
  const darkMode = useDarkMode();
  const t = useTranslation();

  return (
    <div className={centeredContent}>
      <Subtitle
        className={
          darkMode ? missingAtlasIndexDarkStyles : missingAtlasIndexLightStyles
        }
      >
        {t('aggregations.search.noPreviewDocuments', 'No preview documents')}
      </Subtitle>
      <Body>
        {t(
          'aggregations.search.noPreviewDocumentsHint',
          'This may be because your search has no results or your search index does not exist.'
        )}
      </Body>
    </div>
  );
}
