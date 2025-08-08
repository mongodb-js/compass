import {
  Accordion,
  css,
  palette,
  spacing,
  cx,
  useDarkMode,
  FormFieldContainer,
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
  width: '100%',
  textTransform: 'uppercase',
  marginBottom: spacing[400],
});

const buttonStyles = css({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
});

export const DMDrawerSection: React.FC<{
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
        size="small"
      >
        {children}
      </Accordion>
    </div>
  );
};

const formFieldContainerStyles = css({
  marginBottom: spacing[400],
  marginTop: spacing[400],
  '&:first-child': {
    marginTop: 0,
  },
  '&:last-child': {
    marginBottom: 0,
  },
});

export const DMFormFieldContainer: typeof FormFieldContainer = ({
  className,
  ...props
}) => {
  return (
    <FormFieldContainer
      {...props}
      className={cx(formFieldContainerStyles, className)}
    ></FormFieldContainer>
  );
};
