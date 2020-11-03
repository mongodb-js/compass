function requireEnvVar(name) {
  const val = process.env[name];
  if (!val) {
    throw new Error(`The ${name} envirnonment variable must be set.`);
  }

  return val;
}

module.exports = {
  requireEnvVar
};
