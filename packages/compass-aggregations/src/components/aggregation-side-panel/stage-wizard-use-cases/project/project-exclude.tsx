import React from 'react';
import Project from './project';
import type { ProjectOwnProps } from './project';

export default function ProjectInclude(props: ProjectOwnProps) {
  return <Project {...props} variant="exclude" />;
}
