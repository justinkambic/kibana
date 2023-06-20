/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useMemo } from 'react';
import { EuiBasicTableColumn, CriteriaWithPagination } from '@elastic/eui';
import { isEqual } from 'lodash';
import { isNumber } from 'lodash/fp';
import createContainer from 'constate';
import { hostLensFormulas } from '../../../../common/visualizations';
import { useKibanaContextForPlugin } from '../../../../hooks/use_kibana';
import { createInventoryMetricFormatter } from '../../inventory_view/lib/create_inventory_metric_formatter';
import { EntryTitle } from '../components/table/entry_title';
import {
  InfraAssetMetadataType,
  InfraAssetMetricsItem,
  InfraAssetMetricType,
} from '../../../../../common/http_api';
import { useHostFlyoutUrlState } from './use_host_flyout_url_state';
import { Sorting, useHostsTableUrlState } from './use_hosts_table_url_state';
import { useHostsViewContext } from './use_hosts_view';
import { useUnifiedSearchContext } from './use_unified_search';
import { ColumnHeader } from '../components/table/column_header';
import { TOOLTIP, TABLE_COLUMN_LABEL } from '../translations';

/**
 * Columns and items types
 */
export type CloudProvider = 'gcp' | 'aws' | 'azure' | 'unknownProvider';
type HostMetrics = Record<InfraAssetMetricType, number | null>;

interface HostMetadata {
  os?: string | null;
  ip?: string | null;
  servicesOnHost?: number | null;
  title: { name: string; cloudProvider?: CloudProvider | null };
  id: string;
}
export type HostNodeRow = HostMetadata &
  HostMetrics & {
    name: string;
  };

/**
 * Helper functions
 */
const formatMetric = (type: InfraAssetMetricType, value: number | undefined | null) => {
  return value || value === 0 ? createInventoryMetricFormatter({ type })(value) : 'N/A';
};

const buildItemsList = (nodes: InfraAssetMetricsItem[]): HostNodeRow[] => {
  return nodes.map(({ metrics, metadata, name }) => {
    const metadataKeyValue = metadata.reduce(
      (acc, curr) => ({
        ...acc,
        [curr.name]: curr.value,
      }),
      {} as Record<InfraAssetMetadataType, string | null>
    );

    return {
      name,
      id: `${name}-${metadataKeyValue['host.os.name'] ?? '-'}`,
      title: {
        name,
        cloudProvider: (metadataKeyValue['cloud.provider'] as CloudProvider) ?? null,
      },
      os: metadataKeyValue['host.os.name'] ?? '-',
      ip: metadataKeyValue['host.ip'] ?? '',
      ...metrics.reduce(
        (acc, curr) => ({
          ...acc,
          [curr.name]: curr.value ?? 0,
        }),
        {} as HostMetrics
      ),
    };
  });
};

const isTitleColumn = (cell: any): cell is HostNodeRow['title'] => {
  return typeof cell === 'object' && cell && 'name' in cell;
};

const sortValues = (aValue: any, bValue: any, { direction }: Sorting) => {
  if (typeof aValue === 'string' && typeof bValue === 'string') {
    return direction === 'desc' ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
  }

  if (isNumber(aValue) && isNumber(bValue)) {
    return direction === 'desc' ? bValue - aValue : aValue - bValue;
  }

  return 1;
};

const sortTableData =
  ({ direction, field }: Sorting) =>
  (a: HostNodeRow, b: HostNodeRow) => {
    const aValue = a[field as keyof HostNodeRow];
    const bValue = b[field as keyof HostNodeRow];

    if (isTitleColumn(aValue) && isTitleColumn(bValue)) {
      return sortValues(aValue.name, bValue.name, { direction, field });
    }

    return sortValues(aValue, bValue, { direction, field });
  };

/**
 * Columns translations
 */

/**
 * Build a table columns and items starting from the snapshot nodes.
 */
export const useHostsTable = () => {
  const { hostNodes } = useHostsViewContext();
  const { searchCriteria } = useUnifiedSearchContext();
  const [{ pagination, sorting }, setProperties] = useHostsTableUrlState();
  const {
    services: { telemetry },
  } = useKibanaContextForPlugin();
  const [hostFlyoutState, setHostFlyoutState] = useHostFlyoutUrlState();
  const popoverContainerRef = React.createRef<HTMLDivElement>();

  const closeFlyout = useCallback(() => setHostFlyoutState(null), [setHostFlyoutState]);
  const reportHostEntryClick = useCallback(
    ({ name, cloudProvider }: HostNodeRow['title']) => {
      telemetry.reportHostEntryClicked({
        hostname: name,
        cloud_provider: cloudProvider,
      });
    },
    [telemetry]
  );

  const onTableChange = useCallback(
    ({ page, sort }: CriteriaWithPagination<HostNodeRow>) => {
      const { index: pageIndex, size: pageSize } = page;
      const { field, direction } = sort ?? {};

      const currentSorting = { field: field as keyof HostNodeRow, direction };
      const currentPagination = { pageIndex, pageSize };

      if (!isEqual(sorting, currentSorting)) {
        setProperties({ sorting: currentSorting });
      } else if (!isEqual(pagination, currentPagination)) {
        setProperties({ pagination: currentPagination });
      }
    },
    [setProperties, pagination, sorting]
  );

  const items = useMemo(() => buildItemsList(hostNodes), [hostNodes]);
  const clickedItem = useMemo(
    () => items.find(({ id }) => id === hostFlyoutState?.itemId),
    [hostFlyoutState?.itemId, items]
  );

  const currentPage = useMemo(() => {
    const { pageSize = 0, pageIndex = 0 } = pagination;

    const endIndex = (pageIndex + 1) * pageSize;
    const startIndex = pageIndex * pageSize;

    return items.sort(sortTableData(sorting)).slice(startIndex, endIndex);
  }, [items, pagination, sorting]);

  const columns: Array<EuiBasicTableColumn<HostNodeRow>> = useMemo(
    () => [
      {
        name: '',
        width: '40px',
        field: 'id',
        actions: [
          {
            name: TABLE_COLUMN_LABEL.toggleDialogAction,
            description: TABLE_COLUMN_LABEL.toggleDialogAction,
            icon: ({ id }) =>
              hostFlyoutState?.itemId && id === hostFlyoutState?.itemId ? 'minimize' : 'expand',
            type: 'icon',
            'data-test-subj': 'hostsView-flyout-button',
            onClick: ({ id }) => {
              setHostFlyoutState({
                itemId: id,
              });
              if (id === hostFlyoutState?.itemId) {
                setHostFlyoutState(null);
              } else {
                setHostFlyoutState({ itemId: id });
              }
            },
          },
        ],
      },
      {
        name: TABLE_COLUMN_LABEL.title,
        field: 'title',
        sortable: true,
        truncateText: true,
        'data-test-subj': 'hostsView-tableRow-title',
        render: (title: HostNodeRow['title']) => (
          <EntryTitle
            title={title}
            time={searchCriteria.dateRange}
            onClick={() => reportHostEntryClick(title)}
          />
        ),
        width: '20%',
      },
      {
        name: (
          <ColumnHeader
            label={TABLE_COLUMN_LABEL.cpuUsage}
            toolTip={TOOLTIP.cpuUsage}
            formula={hostLensFormulas.cpuUsage.formula.formula}
            popoverContainerRef={popoverContainerRef}
          />
        ),
        field: 'cpu',
        sortable: true,
        'data-test-subj': 'hostsView-tableRow-cpuUsage',
        render: (avg: number) => formatMetric('cpu', avg),
        align: 'right',
      },
      {
        name: (
          <ColumnHeader
            label={TABLE_COLUMN_LABEL.normalizedLoad1m}
            toolTip={TOOLTIP.normalizedLoad1m}
            formula={hostLensFormulas.normalizedLoad1m.formula.formula}
            popoverContainerRef={popoverContainerRef}
          />
        ),
        field: 'normalizedLoad1m',
        sortable: true,
        'data-test-subj': 'hostsView-tableRow-normalizedLoad1m',
        render: (avg: number) => formatMetric('normalizedLoad1m', avg),
        align: 'right',
      },
      {
        name: (
          <ColumnHeader
            label={TABLE_COLUMN_LABEL.memoryUsage}
            toolTip={TOOLTIP.memoryUsage}
            formula={hostLensFormulas.memoryUsage.formula.formula}
            popoverContainerRef={popoverContainerRef}
          />
        ),
        field: 'memory',
        sortable: true,
        'data-test-subj': 'hostsView-tableRow-memoryUsage',
        render: (avg: number) => formatMetric('memory', avg),
        align: 'right',
      },
      {
        name: (
          <ColumnHeader
            label={TABLE_COLUMN_LABEL.memoryFree}
            toolTip={TOOLTIP.memoryFree}
            formula={hostLensFormulas.memoryFree.formula.formula}
            popoverContainerRef={popoverContainerRef}
          />
        ),
        field: 'memoryFree',
        sortable: true,
        'data-test-subj': 'hostsView-tableRow-memoryFree',
        render: (avg: number) => formatMetric('memoryFree', avg),
        align: 'right',
      },
      {
        name: (
          <ColumnHeader
            label={TABLE_COLUMN_LABEL.diskSpaceUsage}
            toolTip={TOOLTIP.diskSpaceUsage}
            formula={hostLensFormulas.diskSpaceUsage.formula.formula}
            popoverContainerRef={popoverContainerRef}
          />
        ),
        field: 'diskSpaceUsage',
        sortable: true,
        'data-test-subj': 'hostsView-tableRow-diskSpaceUsage',
        render: (avg: number) => formatMetric('diskSpaceUsage', avg),
        align: 'right',
      },
      {
        name: (
          <ColumnHeader
            label={TABLE_COLUMN_LABEL.rx}
            toolTip={TOOLTIP.rx}
            formula={hostLensFormulas.rx.formula.formula}
            popoverContainerRef={popoverContainerRef}
          />
        ),
        field: 'rx',
        sortable: true,
        'data-test-subj': 'hostsView-tableRow-rx',
        render: (avg: number) => formatMetric('rx', avg),
        align: 'right',
        width: '120px',
      },
      {
        name: (
          <ColumnHeader
            label={TABLE_COLUMN_LABEL.tx}
            toolTip={TOOLTIP.tx}
            formula={hostLensFormulas.tx.formula.formula}
            popoverContainerRef={popoverContainerRef}
          />
        ),
        field: 'tx',
        sortable: true,
        'data-test-subj': 'hostsView-tableRow-tx',
        render: (avg: number) => formatMetric('tx', avg),
        align: 'right',
        width: '120px',
      },
    ],
    [
      hostFlyoutState?.itemId,
      reportHostEntryClick,
      searchCriteria.dateRange,
      setHostFlyoutState,
      popoverContainerRef,
    ]
  );

  return {
    columns,
    clickedItem,
    currentPage,
    closeFlyout,
    items,
    isFlyoutOpen: !!hostFlyoutState?.itemId,
    onTableChange,
    pagination,
    sorting,
    refs: {
      popoverContainerRef,
    },
  };
};

export const HostsTable = createContainer(useHostsTable);
export const [HostsTableProvider, useHostsTableContext] = HostsTable;
