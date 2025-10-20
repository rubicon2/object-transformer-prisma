// Common sets of rules for GET, mainly. Like limit, skip, sort by, order by, etc.
import { copy } from '@rubicon2/object-transformer';
import deepMerge from '@rubicon2/deep-merge';
import pathToNestedObj from 'path-to-nested-obj';

/** @type {import('@rubicon2/object-transformer/lib/object-transformer.mjs').rules} */
const get = {
  take: copy({ parser: parseInt }),
  skip: copy({ parser: parseInt }),
  cursor: copy({
    destinationKey: 'cursor.id',
    // Override any user-set pathSeparator so the desintationKey works properly.
    options: { pathSeparator: '.' },
  }),
  orderBy: copy({
    destinationKey: '_temp.orderBy',
    options: { pathSeparator: '.' },
  }),
  sortOrder: copy({
    destinationKey: '_temp.sortOrder',
    options: { pathSeparator: '.' },
  }),
  _onFinish: ({ output, options }) => {
    const orderBy = output._temp?.orderBy;
    const sortOrder = output._temp?.sortOrder;
    // If orderBy does not exist, there is no point in continuing.
    // But it doesn't matter if sortOrder doesn't exist - we will default all orderBy to 'asc'.
    if (!orderBy) return;

    // Make sure these are both in arrays so we don't have to program an array version and non-array version.
    const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
    const sortOrderArray = Array.isArray(sortOrder) ? sortOrder : [sortOrder];

    // Prisma expects an array for orderBy, but start with an obj so we can easily
    // create nested ordering, so we can order by values of foreign relations.
    let orderByObj = {};
    for (const orderByPath of orderByArray) {
      // For each orderByPath, get a corresponding value from the sortOrderArray.
      // Then create nested obj and set value to sortOrder value or 'asc' if none exists.
      const sortOrder = sortOrderArray.shift();
      orderByObj = deepMerge(
        orderByObj,
        // If no sortOrder value for this, default to 'asc', i.e. ascending order.
        pathToNestedObj(orderByPath, options.pathSeparator, sortOrder || 'asc'),
        // Overwrite existing value at the deepest level.
        // We do not want different values turning into an array, i.e. ['asc', 'desc'].
        (a, b) => b,
      );
    }

    // Prisma expects an array so turn object into one.
    const orderByFinalArr = Object.entries(orderByObj).map(([key, value]) => ({
      [key]: value,
    }));
    output.orderBy = orderByFinalArr;
  },
};

export { get };
