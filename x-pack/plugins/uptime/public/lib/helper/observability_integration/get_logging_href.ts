/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { get } from 'lodash';
import { LatestMonitor } from '../../../../common/graphql/types';
import { addBasePath } from './add_base_path';

export const getLoggingContainerHref = (
  monitor: LatestMonitor,
  basePath: string
): string | undefined => {
  const containerId = get<string | undefined>(monitor, 'ping.container.id', undefined);
  if (typeof containerId === 'undefined') {
    return containerId;
  }
  return addBasePath(
    basePath,
    `/app/infra#/logs?logFilter=(expression:'container.id%20:%20${containerId}',kind:kuery)`
  );
};
