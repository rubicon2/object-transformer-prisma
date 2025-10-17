// Common functions for creating rules to use when transforming a query obj to prisma ORM query format.
// These should create the object structure, but not alter where it is put, for maxiumum flexibility.
import { copy, parseDate } from '@rubicon2/object-transformer';

const copyIncludes = (destinationKey) => {
  return copy({
    destinationKey,
    parser: (value) => ({ contains: value }),
  });
};

const copyIncludesInsensitive = (destinationKey) => {
  return copy({
    destinationKey,
    parser: (value) => ({ contains: value, mode: 'insensitive' }),
  });
};

const copyDate = (destinationKey) => {
  return copy({
    destinationKey,
    parser: parseDate,
  });
};

export { copyIncludes, copyIncludesInsensitive, copyDate };
