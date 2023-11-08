/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { schema } from '@kbn/config-schema';
import { ALL_SPACES_ID } from '@kbn/security-plugin/common/constants';
import { DEFAULT_SPACE_ID } from '@kbn/spaces-plugin/common';
import { certThresholdSavedObjectId } from '../../../common/saved_objects/cert_thresholds';
import { SYNTHETICS_API_URLS } from '../../../common/constants';
import { certificateThresholdType } from '../../../common/types/saved_objects';
import { SyntheticsRestApiRouteFactory } from '../types';

export const addCertsThresholdRoute: SyntheticsRestApiRouteFactory = () => ({
  method: 'POST',
  path: SYNTHETICS_API_URLS.CERT_THRESHOLDS,
  validate: {
    body: schema.object({
      certAgeThreshold: schema.number(),
      certExpirationThreshold: schema.number(),
      shareAcrossSpaces: schema.maybe(schema.boolean()),
    }),
  },
  writeAccess: true,
  handler: async ({ request, savedObjectsClient, server }) => {
    console.log('in handler');
    // await savedObjectsClient.create<CertThresholds>()
    const { id: space } = (await server.spaces?.spacesService.getActiveSpace(request)) ?? {
      id: DEFAULT_SPACE_ID,
    };
    console.log('after get space', space);

    const { shareAcrossSpaces, ...thresholds } = request.body;

    try {
      console.log('about to create');
      const result = await savedObjectsClient.create(certificateThresholdType, thresholds, {
        id: certThresholdSavedObjectId,
        initialNamespaces: !!shareAcrossSpaces ? [ALL_SPACES_ID] : [space],
        overwrite: true,
      });
      console.log('the result', result);
    } catch (e) {
      console.log('caught error', e);
    }

    return {};
  },
});
