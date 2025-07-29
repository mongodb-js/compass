import {
  Accordion,
  css,
  palette,
  spacing,
  cx,
  useDarkMode,
} from '@mongodb-js/compass-components';
import React from 'react';

const containerStyles = css({
  '&:first-child': {
    marginTop: `-${spacing[400]}px`,
  },
  borderBottom: `1px solid ${palette.gray.light2}`,
  marginLeft: `-${spacing[400]}px`,
  marginRight: `-${spacing[400]}px`,
  padding: spacing[400],
});

const darkModeContainerStyles = css({
  borderBottom: `1px solid ${palette.gray.dark2}`,
});

const accordionTitleStyles = css({
  fontSize: spacing[300],
  width: '100%',
});

const buttonStyles = css({
  width: '100%',
  display: 'flex',
});

const DMDrawerSection: React.FC<{
  label: React.ReactNode;
}> = ({ label, children }) => {
  const darkMode = useDarkMode();
  return (
    <div className={cx(containerStyles, darkMode && darkModeContainerStyles)}>
      <Accordion
        text={label}
        defaultOpen={true}
        textClassName={accordionTitleStyles}
        buttonTextClassName={buttonStyles}
      >
        {children}
      </Accordion>
    </div>
  );
};

export default DMDrawerSection;
