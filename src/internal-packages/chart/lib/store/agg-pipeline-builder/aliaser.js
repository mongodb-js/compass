/**
 * Assigns and retrieves unique aliases during aggregation pipeline building
 * to prevent naming collisions.
 *
 * The dependent variables that make a unique alias are the field name and
 * the channel name. An already existing field/channel combination does not
 * create a new alias but instead returns the same previously defined alias
 * for this combination.
 */
class AggregationAliaser {

  constructor() {
    this.aliases = {};
  }

  /**
   * Assigns a unique alias name to a field/channel combination, in order
   * to prevent naming collisions during pipeline execution.
   *
   * If a field/channel combination has already been mapped, just return
   * the same alias without creating a new one.
   *
   * @param  {String} field     field name
   * @param  {String} channel   channel name
   * @return {String}           a temporary alias name
   */
  assignUniqueAlias(field, channel) {
    let alias = this.getAlias(field, channel);
    if (!alias) {
      const count = Object.keys(this.aliases).length;
      alias = `__alias_${ count }`;
      this.aliases[`${channel}_${field}`] = alias;
    }
    return alias;
  }

  /**
   * This function returns the alias name given a field and a channel.
   *
   * @param  {String} field     field name
   * @param  {String} channel   channel name
   * @return {String}           the stored alias name
   */
  getAlias(field, channel) {
    return this.aliases[`${channel}_${field}`];
  }
}

module.exports = AggregationAliaser;
