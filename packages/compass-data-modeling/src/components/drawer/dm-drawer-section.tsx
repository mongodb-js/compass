import {
  Accordion,
  css,
  palette,
  spacing,
} from '@mongodb-js/compass-components';
import React from 'react';

const containerStyles = css({
  '&:not(:first-child)': {
    borderTop: `1px solid ${palette.gray.light2}`,
  },
  marginLeft: `-${spacing[400]}px`,
  marginRight: `-${spacing[400]}px`,
  padding: spacing[400],
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
  return (
    <div className={containerStyles}>
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
