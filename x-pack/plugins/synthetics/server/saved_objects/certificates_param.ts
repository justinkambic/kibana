/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { SavedObjectsType } from '@kbn/core/server';
import { certificateThresholdType } from '../../common/types/saved_objects';

export const syntheticsCertThresholdSavedObjectsType: SavedObjectsType = {
  name: certificateThresholdType,
  hidden: false,
  namespaceType: 'multiple',
  mappings: {
    dynamic: false,
    properties: {
      certAgeThreshold: {
        type: 'integer',
      },
      certExpirationThreshold: {
        type: 'integer',
      },
    },
  },
  management: {
    importableAndExportable: false,
    icon: 'uptimeApp',
  },
};
