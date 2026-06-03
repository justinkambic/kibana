/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { useEffect, useRef, useState } from 'react';
import type { HttpStart } from '@kbn/core/public';

/**
 * SPIKE: Relevance sort for the metrics grid.
 *
 * Problem: "relevance" has no formal definition yet.  This hook implements one
 * concrete candidate signal — alert-rule presence — to explore the technical
 * cost and architectural implications before the DnD design discussion.
 *
 * Chosen signal: a metric is considered "relevant" if at least one active
 * Kibana alerting rule references it.  The hook queries the internal alerting
 * rules API and returns a Map<metricName, score> where score > 0 means the
 * metric appears in at least one rule.
 *
 * Architectural implications surfaced by this spike:
 *
 *  1. Additional HTTP request — This hook makes a secondary request that falls
 *     outside the existing METRICS_INFO ES|QL pipeline.  That violates the
 *     "everything below the editor is client-side manipulation of the dataset"
 *     principle raised by Tim Schnell (see Slack thread 2026-06-02).  To use
 *     this in production we need a formal decision from the DnD group.
 *
 *  2. No changes to Discover-owned code required — `http` is injected through
 *     the existing ExternalServices mechanism that we already own.  The only
 *     Discover-team touchpoint would be formalising `http` in ChartSectionProps
 *     if they ever want to enforce the "no extra requests" rule at the type
 *     level.
 *
 *  3. Matching quality — Alert rule params are rule-type-specific and vary
 *     widely.  This implementation uses a best-effort substring match against
 *     rule names, tags, and serialised params.  A production implementation
 *     would target specific rule types (e.g. observability.rules.custom_threshold)
 *     and extract metric field references from their structured params.
 *
 *  4. Performance — The alerting API is called once per metrics grid mount
 *     (or whenever metric names change) and is not re-triggered by time range
 *     or filter changes.  This is intentional for the spike; production use
 *     would need cache/TTL decisions.
 */

const ALERTING_RULES_API = '/internal/alerting/rules/_find';
const RULES_PER_PAGE = 500;
const OBSERVABILITY_CONSUMERS = ['observability', 'infrastructure', 'logs', 'apm', 'uptime'];

interface AlertingRulesResponse {
  data: Array<{
    name: string;
    tags: string[];
    params: Record<string, unknown>;
    enabled: boolean;
  }>;
  total: number;
  page: number;
  per_page: number;
}

/**
 * Fetches all enabled alerting rules for observability consumers and returns
 * a relevance score map for the given metric names.
 *
 * Score semantics:
 *  2 — metric name appears in a rule's name (strong signal)
 *  1 — metric name appears in the rule's tags or serialised params (weaker signal)
 *  0 — no matching rule found (baseline)
 *
 * When `http` is undefined (not injected by the host) the function returns an
 * empty map, causing the relevance comparator to fall back to alphabetical order.
 */
export function useMetricsRelevanceScores({
  metricNames,
  http,
}: {
  metricNames: string[];
  http: HttpStart | undefined;
}): { scores: Map<string, number>; loading: boolean; error: Error | null } {
  const [scores, setScores] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Keep a stable string key so the effect only fires when the set of metric
  // names actually changes, not just when the array reference is recreated.
  const metricNamesKey = metricNames.slice().sort().join('\0');

  // Capture current metricNames without listing the unstable array in deps.
  const metricNamesRef = useRef(metricNames);
  metricNamesRef.current = metricNames;

  useEffect(() => {
    const currentMetricNames = metricNamesRef.current;

    if (!http || currentMetricNames.length === 0) {
      setScores(new Map());
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchRelevanceScores(http, currentMetricNames)
      .then((result) => {
        if (!cancelled) {
          setScores(result);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [http, metricNamesKey]); // metricNamesKey is a stable proxy for metricNames content

  return { scores, loading, error };
}

async function fetchRelevanceScores(
  http: HttpStart,
  metricNames: string[]
): Promise<Map<string, number>> {
  const allRules: AlertingRulesResponse['data'] = [];
  let page = 1;

  // Paginate through all rules.  For large deployments the first page is
  // usually enough; we cap at 3 pages to avoid runaway requests in the spike.
  while (page <= 3) {
    const response = await http.get<AlertingRulesResponse>(ALERTING_RULES_API, {
      query: {
        page,
        per_page: RULES_PER_PAGE,
        filter: `alert.attributes.consumer: (${OBSERVABILITY_CONSUMERS.join(' or ')})`,
        // Only score against currently enabled rules.
        rule_statuses: 'enabled',
      },
    });

    const enabledRules = response.data.filter((r) => r.enabled);
    allRules.push(...enabledRules);

    if (allRules.length >= response.total || response.data.length < RULES_PER_PAGE) {
      break;
    }
    page++;
  }

  return scoreMetrics(metricNames, allRules);
}

function scoreMetrics(
  metricNames: string[],
  rules: AlertingRulesResponse['data']
): Map<string, number> {
  const scores = new Map<string, number>(metricNames.map((name) => [name, 0]));

  // Pre-serialise rule data once to avoid repeated JSON.stringify inside the inner loop.
  const ruleRecords = rules.map((rule) => ({
    nameLower: rule.name.toLowerCase(),
    tagsLower: rule.tags.map((t) => t.toLowerCase()),
    paramsStr: JSON.stringify(rule.params).toLowerCase(),
  }));

  for (const metricName of metricNames) {
    const needle = metricName.toLowerCase();
    let best = 0;

    for (const rule of ruleRecords) {
      if (rule.nameLower.includes(needle)) {
        best = Math.max(best, 2);
        break; // Already at max score for this metric.
      }
      if (rule.tagsLower.some((tag) => tag.includes(needle)) || rule.paramsStr.includes(needle)) {
        best = Math.max(best, 1);
      }
    }

    scores.set(metricName, best);
  }

  return scores;
}
