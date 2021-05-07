/**
 * Verify the distribution is passed as an argument.
 *
 * @param {Object} argv - The arguments.
 */
const verifyDistribution = (argv) => {
  if (argv._ && argv._[1]) {
    process.env.HADRON_DISTRIBUTION = argv._[1];
  }
};

module.exports = verifyDistribution;
