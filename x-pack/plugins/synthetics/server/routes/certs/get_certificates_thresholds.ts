/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { SavedObject } from '@kbn/core-saved-objects-api-server';
import { certificateThresholdType } from '../../../common/types/saved_objects';
import { SYNTHETICS_API_URLS } from '../../../common/constants';
import { SyntheticsRestApiRouteFactory } from '../types';
import { certThresholdSavedObjectId } from '../../../common/saved_objects/cert_thresholds';

interface CertThresholds {
  certAgeThreshold: number;
  certExpirationThreshold: number;
}

export const getCertsThresholdRoute: SyntheticsRestApiRouteFactory<
  { data: CertThresholds | null },
  {}
> = () => ({
  method: 'GET',
  path: SYNTHETICS_API_URLS.CERT_THRESHOLDS,
  validate: {},
  handler: async ({ savedObjectsClient }) => {
    console.log('hitting handler');
    try {
      const savedObject = await savedObjectsClient.get<CertThresholds>(
        certificateThresholdType,
        certThresholdSavedObjectId
      );
      console.log('after get request');
      return {
        data: savedObject,
      };
    } catch (e) {
      console.log('caught error', e);
      return { data: null };
    }
  },
});
