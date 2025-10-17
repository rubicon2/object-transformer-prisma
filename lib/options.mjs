/** @type {import('@rubicon2/object-transformer').options} */
const options = {
  // Do not include any values from keys we are not expecting. Would cause errors if given to prisma.
  omitRulelessKeys: true,
  // Omit empty strings, if a user has not entered a value in a search box and empty string
  // is included in query/body, then prisma will search for '' instead of omitting field from query.
  omitEmptyStrings: true,
};

export default options;
