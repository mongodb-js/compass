import type { SimpleEvalCase } from '../assistant.eval';
import { evalCases } from './explain-plan';

export function makeEntrypointCases(): SimpleEvalCase[] {
  return [
    ...evalCases,
    // TODO: add connection error entry point and performance insight entry points
  ];
}
