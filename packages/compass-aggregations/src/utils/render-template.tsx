import React from 'react';

export const renderTemplate = (
  template: string,
  values: Record<string, React.ReactNode>
) => {
  return template.split(/(\{\w+\})/).map((part, index) => {
    const name = /^\{(\w+)\}$/.exec(part)?.[1];
    return name && name in values ? (
      <React.Fragment key={index}>{values[name]}</React.Fragment>
    ) : (
      part
    );
  });
};
