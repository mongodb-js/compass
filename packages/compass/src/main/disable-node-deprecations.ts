if (process.env.NODE_ENV !== 'development') {
  // Remove the built-in Node.js listener that prints e.g. deprecation
  // warnings.
  process.removeAllListeners('warning');
}
