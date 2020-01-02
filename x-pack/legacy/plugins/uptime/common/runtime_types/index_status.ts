/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import * as t from 'io-ts';

const Status = t.type({
  exists: t.boolean,
});

const Count = t.partial({
  count: t.number,
});

export const IndexStatusType = t.intersection([Status, Count]);

export type IndexStatus = t.TypeOf<typeof IndexStatusType>;
