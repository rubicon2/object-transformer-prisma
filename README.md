# object-transformer-prisma

A ruleset for [object-transformer](https://www.npmjs.com/package/@rubicon2/object-transformer). Basically a re-implementation of [url-query-for-prisma](https://www.npmjs.com/package/url-query-to-prisma?activeTab=readme), which was too inflexible and was really only designed with get requests in mind.

Common rules for use with object-transformer to create query objects for Prisma ORM.

## Install

```sh
npm install @rubicon2/object-transformer-prisma
```

## Examples

### An Express Application

```js
import transformer, { copy } from '@rubicon2/object-transformer';
import { rulesets, options } from '@rubicon2/object-transformer-prisma';
import { PrismaClient } from '../generated/prisma/client';
import express from 'express';

const app = express();
const prisma = new PrismaClient();

app.get('/user', async (req, res) => {
  try {
    // Set up a transformer with the rules and options we want.
    const queryTransformer = transformer(rulesets.get, options);
    // Use it to transform req.query into an object for prisma to use.
    const query = queryTransformer(req.query);
    const users = await prisma.user.findMany(query);
    res.send({
      status: 'success',
      data: {
        users
      }
    })
  } catch (error) {
    console.error(error.message);
    res.sendStatus(500);
  }
});

app.listen(8080, () => console.log('Listening on post 8080'));
```

### Extending The Ruleset

You can easily add your own rules as below. There are some useful rule functions that can be imported and used to generate the correct structures for common prisma queries.

```js
import transformer { copy } from '@rubicon2/object-transformer';
import { rulesets, options } from '@rubicon2/object-transformer-prisma';

const getUsersRuleset = {
  ...rulesets.get,
  // We can run a prisma query based on params from req.query, or req.body.
  email: copyIncludesInsensitive('where.email'),
  fromDate: copyDate('where.createdAt.gte'),
  toDate: copyDate('where.createdAt.lte'),
  _onFinish: (params) => {
    // get._onFinish completes the work started by get.orderBy and get.sortOrder rules, so for those 
    // values on the input object to be processed properly, we need to make sure get._onFinish runs.
    rulesets.get._onFinish(params);
    // Whatever extra stuff you need to do after all other rules have finished.
  }
}

const getUsersTransformer = transformer(getUsersRuleset, options);
```

## rulesets.get

|Rule|Notes|
|----|-----|
|```take```|How many results to get. Automatically parsed into an integer.|
|```skip```|How many results to skip. Automatically parsed into an integer.|
|```cursor```|To facilitate cursor-based pagination. Not parsed, as ids are likely to be uuid strings. Can easily be overridden with your own cursor function if you need a number instead of a string.|
|```orderBy```|Takes a string or an array of strings. Can use nested object paths.|
|```sortOrder```|Takes a string or an array of strings. Should be 'asc' or 'desc'.|
|```_onFinish```|Takes data collected by orderBy and sortOrder and formats correctly for prisma query.|

The rulesets import only has one ruleset so far (get), but it has been structured to allow more rulesets to be added in future if need be.

## Options

The ```options``` import contains what are probably the best practice settings for using prisma with this.

Firstly, it sets ```omitRulelessKeys``` to ```true```, so object-transformer will ignore any input keys that don't have a corresponding rule. Without this, if a user submits a query with a key with a random name, it will automatically get copied over to the output object and when it gets given to prisma, if there is no corresponding column with that name on the database table, prisma will throw an error and crash.

The options import also has ```omitEmptyStrings``` set to ```true```, so that any inputs with empty values will be ignored. If a user has submitted a search form with some empty fields, it seems natural to ignore the empty fields rather than include them on the query.

## Rules

|Rule|Description|
|----|-----------|
|```copyIncludes```|Creates a structure to partially match a string.|
|```copyIncludesInsensitive```|Creates a structure to case-insensitively partially match a string.|
