/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { UMRestApiRouteFactory } from '../types';
import { UMServerLibs } from '../../lib/lib';

export const createGetDocCountRoute: UMRestApiRouteFactory = (libs: UMServerLibs) => ({
  method: 'GET',
  path: '/api/uptime/docs/count',
  validate: false,
  options: {
    tags: ['access:uptime'],
  },
  handler: async ({ callES }, _context, _request, response) => {
    const result = await libs.pings.getDocCount({ callES });

    return response.ok({
      body: {
        ...result,
      },
    });
  },
});
