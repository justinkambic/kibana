/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { schema } from '@kbn/config-schema';
import { isRight } from 'fp-ts/lib/Either';
import { ThrowReporter } from 'io-ts/lib/ThrowReporter';
import { i18n } from '@kbn/i18n';
import { AlertExecutorOptions } from '../../../../alerting/server';
import { ACTION_GROUP_DEFINITIONS } from '../../../../../legacy/plugins/uptime/common/constants';
import { UptimeAlertTypeFactory } from './types';
import { GetMonitorStatusResult } from '../requests';
import {
  StatusCheckExecutorParamsType,
  StatusCheckAlertStateType,
  StatusCheckAlertState,
} from '../../../../../legacy/plugins/uptime/common/runtime_types';

const { DOWN_MONITOR } = ACTION_GROUP_DEFINITIONS;

/**
 * Reduce a composite-key array of status results to a set of unique IDs.
 * @param items to reduce
 */
export const uniqueMonitorIds = (items: GetMonitorStatusResult[]): Set<string> =>
  items.reduce((acc, { monitor_id }) => {
    acc.add(monitor_id);
    return acc;
  }, new Set<string>());

/**
 * Generates a message to include in contexts of alerts.
 * @param monitors the list of monitors to include in the message
 * @param max
 */
export const contextMessage = (monitorIds: string[], max: number): string => {
  const MIN = 2;
  if (max < MIN) throw new Error(`Maximum value must be greater than ${MIN}, received ${max}.`);

  // generate the message
  let message;
  if (monitorIds.length === 1) {
    message = i18n.translate('xpack.uptime.alerts.message.singularTitle', {
      defaultMessage: 'Down monitor: ',
    });
  } else if (monitorIds.length) {
    message = i18n.translate('xpack.uptime.alerts.message.multipleTitle', {
      defaultMessage: 'Down monitors: ',
    });
  }
  // this shouldn't happen because the function should only be called
  // when > 0 monitors are down
  else {
    message = i18n.translate('xpack.uptime.alerts.message.emptyTitle', {
      defaultMessage: 'No down monitor IDs received',
    });
  }

  for (let i = 0; i < monitorIds.length; i++) {
    const id = monitorIds[i];
    if (i === max) {
      return (
        message +
        i18n.translate('xpack.uptime.alerts.message.overflowBody', {
          defaultMessage: `... and {overflowCount} other monitors`,
          values: {
            overflowCount: monitorIds.length - i,
          },
        })
      );
    } else if (i === 0) {
      message = message + id;
    } else {
      message = message + `, ${id}`;
    }
  }

  return message;
};

/**
 * Creates an exhaustive list of all the down monitors.
 * @param list all the monitors that are down
 * @param sizeLimit the max monitors, we shouldn't allow an arbitrarily long string
 */
export const fullListByIdAndLocation = (
  list: GetMonitorStatusResult[],
  sizeLimit: number = 1000
) => {
  return (
    list
      // sort by id, then location
      .sort((a, b) => {
        if (a.monitor_id > b.monitor_id) {
          return 1;
        } else if (a.monitor_id < b.monitor_id) {
          return -1;
        } else if (a.location > b.location) {
          return 1;
        }
        return -1;
      })
      .slice(0, sizeLimit)
      .reduce((cur, { monitor_id: id, location }) => cur + `${id} from ${location}; `, '') +
    (sizeLimit < list.length
      ? i18n.translate('xpack.uptime.alerts.message.fullListOverflow', {
          defaultMessage: '...and {overflowCount} other {pluralizedMonitor}',
          values: {
            pluralizedMonitor:
              list.length - sizeLimit === 1 ? 'monitor/location' : 'monitors/locations',
            overflowCount: list.length - sizeLimit,
          },
        })
      : '')
  );
};

export const updateState = (
  state: Record<string, any>,
  isTriggeredNow: boolean
): StatusCheckAlertState => {
  const now = new Date().toISOString();
  const decoded = StatusCheckAlertStateType.decode(state);
  if (!isRight(decoded)) {
    const triggerVal = isTriggeredNow ? now : undefined;
    return {
      currentTriggerStarted: triggerVal,
      firstCheckedAt: now,
      firstTriggeredAt: triggerVal,
      isTriggered: isTriggeredNow,
      lastTriggeredAt: triggerVal,
      lastCheckedAt: now,
      lastResolvedAt: undefined,
    };
  }
  const {
    currentTriggerStarted,
    firstCheckedAt,
    firstTriggeredAt,
    lastTriggeredAt,
    // this is the stale trigger status, we're naming it `wasTriggered`
    // to differentiate it from the `isTriggeredNow` param
    isTriggered: wasTriggered,
    lastResolvedAt,
  } = decoded.right;

  let cts: string | undefined;
  if (isTriggeredNow && !currentTriggerStarted) {
    cts = now;
  } else if (isTriggeredNow) {
    cts = currentTriggerStarted;
  }

  return {
    currentTriggerStarted: cts,
    firstCheckedAt: firstCheckedAt ?? now,
    firstTriggeredAt: isTriggeredNow && !firstTriggeredAt ? now : firstTriggeredAt,
    lastCheckedAt: now,
    lastTriggeredAt: isTriggeredNow ? now : lastTriggeredAt,
    lastResolvedAt: !isTriggeredNow && wasTriggered ? now : lastResolvedAt,
    isTriggered: isTriggeredNow,
  };
};

// Right now the maximum number of monitors shown in the message is hardcoded here.
// we might want to make this a parameter in the future
const DEFAULT_MAX_MESSAGE_ROWS = 3;

export const statusCheckAlertFactory: UptimeAlertTypeFactory = (server, libs) => ({
  id: 'xpack.uptime.alerts.downMonitor',
  name: 'X-Pack Alerting',
  validate: {
    params: schema.object({
      filters: schema.maybe(schema.string()),
      numTimes: schema.number(),
      timerange: schema.object({
        from: schema.string(),
        to: schema.string(),
      }),
      locations: schema.arrayOf(schema.string()),
    }),
  },
  defaultActionGroupId: DOWN_MONITOR.id,
  actionGroups: [
    {
      id: DOWN_MONITOR.id,
      name: DOWN_MONITOR.name,
    },
  ],
  async executor(options: AlertExecutorOptions) {
    const { params: rawParams } = options;
    const decoded = StatusCheckExecutorParamsType.decode(rawParams);
    if (!isRight(decoded)) {
      ThrowReporter.report(decoded);
      return {
        error: 'Alert param types do not conform to required shape.',
      };
    }

    const params = decoded.right;

    /* This is called `monitorsByLocation` but it's really
     * monitors by location by status. The query we run to generate this
     * filters on the status field, so effectively there should be one and only one
     * status represented in the result set. */
    const monitorsByLocation = await libs.requests.getMonitorStatus({
      callES: options.services.callCluster,
      ...params,
    });

    // if no monitors are down for our query, we don't need to trigger an alert
    if (monitorsByLocation.length) {
      const uniqueIds = uniqueMonitorIds(monitorsByLocation);
      const alertInstance = options.services.alertInstanceFactory(DOWN_MONITOR.id);
      alertInstance.replaceState({
        ...options.state,
        monitors: monitorsByLocation,
      });
      alertInstance.scheduleActions(DOWN_MONITOR.id, {
        message: contextMessage(Array.from(uniqueIds.keys()), DEFAULT_MAX_MESSAGE_ROWS),
        server,
        completeIdList: fullListByIdAndLocation(monitorsByLocation),
      });
    }

    // this stateful data is at the cluster level, not an alert instance level,
    // so any alert of this type will flush/overwrite the state when they return
    return updateState(options.state, monitorsByLocation.length > 0);
  },
});
