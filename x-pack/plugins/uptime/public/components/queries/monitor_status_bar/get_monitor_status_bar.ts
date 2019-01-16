/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import gql from 'graphql-tag';

export const getMonitorStatusBarQueryString = `
query MonitorStatus(
  $dateRangeStart: UnsignedInteger!
  $dateRangeEnd: UnsignedInteger!
  $monitorId: String
) {
  monitorStatus: getLatestMonitors(
    dateRangeStart: $dateRangeStart
    dateRangeEnd: $dateRangeEnd
    monitorId: $monitorId
  ) {
    timestamp
    monitor {
      status
      host
      ip
      duration {
        us
      }
      scheme
    }
    tcp {
      port
    }
  }
}
`;

export const getMonitorStatusBarQuery = gql`
  ${getMonitorStatusBarQueryString}
`;
