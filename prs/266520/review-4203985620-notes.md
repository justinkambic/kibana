---
pr: https://github.com/elastic/kibana/pull/266520
review: https://github.com/elastic/kibana/pull/266520#pullrequestreview-4203985620
reviewer: lucaslopezf
processed_at: 2026-04-30
worktree: ~/git/justinkambic/kibana-worktrees/262360-graceful-field-type-conflicts
branch: 262360-graceful-field-type-conflicts
head_at_processing: f3f441863dec3efca31343b8f25d8b07319a3975
---

# Review 4203985620 — Lucas Lopez

Review body: "Great Justin!! Just some doubts" — state: COMMENTED. Two inline comments on
`src/platform/packages/shared/kbn-unified-chart-section-viewer/src/common/utils/esql/create_esql_query.ts`.

## Comment 1 — line 40, `isConcreteSingleSource`

Link: https://github.com/elastic/kibana/pull/266520#discussion_r3166926913

> Do we have a standard way to know this in Kibana? I mean, it seems good but I wonder if we
> are missing some edge-cases and break something

### Classification: Acknowledge (no code change)

Lucas is asking whether there is an existing canonical helper for "the user typed a single
concrete index source (no glob, no comma list)" so we are not reinventing detection that lives
elsewhere.

I checked. `kbn-esql-utils` exports a number of source-related helpers
(`getIndexPatternFromESQLQuery`, `getSourceCommandFromESQLQuery`,
`getRemoteClustersFromESQLQuery`, `replaceESQLQueryIndexPattern`, etc.) but none of them
expose a "is this a single concrete source" predicate. A grep of the repo for `includes('*')`
/ `includes(',')` against source strings turns up only ad-hoc checks in
`src/platform/plugins/shared/data/...`, not a shared utility.

The check is also narrowly scoped to this rebuild path: we are not parsing an arbitrary
ES|QL source spec (which could include remote-cluster prefixes, quoted lists,
selectors, etc.), we are inspecting the value already extracted upstream by
`getIndexPatternFromESQLQuery`. The question is purely "did the user point at one thing, or
several / a pattern". The two-inclusion test is sufficient for that and matches what the
caller in `metrics_grid.tsx` produces.

Edge cases that could theoretically slip past:
- Remote cluster syntax (`cluster:my-index`) — `getIndexPatternFromESQLQuery` returns the
  pattern as-typed, so this would currently be treated as concrete. In practice the rebuilt
  chart query would still target the same source the user typed, so this is benign — the
  scope still matches what METRICS_INFO scanned.
- Whitespace — `getIndexPatternFromESQLQuery` does not produce strings with embedded spaces
  in normal cases, so trimming would be defensive but not load-bearing.

Reply to Lucas: explain there is no shared helper, link to the doc-comment above the
function that explains the rationale, and note that we are only inspecting an already-
extracted single-source value (not parsing arbitrary ES|QL), so the predicate is narrowly
correct.

## Comment 2 — line 64, `originalSource` selection

Link: https://github.com/elastic/kibana/pull/266520#discussion_r3166984653

> So, if I understand correctly.
> Before: If a user entered a backing index, we rendered the chart using the data stream.
> Now: If a user enters a backing index, we render the chart using the backing index itself,
> not the corresponding data stream, right?
>
> I'm a bit concerned we might be missing something. It seems like a simple change on the
> surface, but it could be breaking other things under the hood.
> Looping in @miguel-sanchez-elastic as well, since this is also product-related

### Classification: Acknowledge (no code change)

Lucas's reading of the change is exactly correct. This is the entire point of the PR
(see commit 4ea363aaf7ed and issue #262360):

- METRICS_INFO returns the parent data stream name even when invoked against a single
  backing index.
- Naively reusing that as the chart query source widens the scope back out to the whole
  data stream, which re-introduces the cross-backing-index field-type conflicts METRICS_INFO
  had filtered out at the narrower scope.
- The `verification_exception` Lucas himself reported in
  https://github.com/elastic/kibana/issues/262360#issuecomment-4334258317 is exactly that
  scope mismatch.

Behavioral guarantees in the current change:
- Single concrete source (e.g. `.ds-foo-2026.04.29-000001` or a single index name): use it
  as-typed. Scope of chart query == scope METRICS_INFO scanned.
- Glob (`logs-*`): fall back to `metricItem.dataStream` so per-data-stream chart isolation
  is preserved when the user's pattern resolves to many data streams.
- Comma list (`a,b`): same fallback for the same reason.
- `undefined` / empty string: fall back to `metricItem.dataStream`.

These are covered by tests added in the same commit (see
`create_esql_query.test.ts` describe block "originalSource (issue #262360)").

This is a clarifying / product-review question, not a change request. Reply to Lucas (and
@miguel-sanchez-elastic for product sign-off) restating the above, and link to the issue
comment showing the original verification_exception.

## Summary

| # | File:Line                     | Classification | Action            |
|---|-------------------------------|----------------|-------------------|
| 1 | create_esql_query.ts:40       | Acknowledge    | Reply, no commit  |
| 2 | create_esql_query.ts:64       | Acknowledge    | Reply, no commit  |

No commits added to the branch in this pass. Branch HEAD remains
`f3f441863dec3efca31343b8f25d8b07319a3975`.

## Suggested replies

### Reply to comment 1
> Good question. There isn't a shared helper for this in `kbn-esql-utils` (I grep'd —
> we have `getIndexPatternFromESQLQuery`, `getRemoteClustersFromESQLQuery`,
> `getSourceCommandFromESQLQuery`, etc., but no "single concrete source" predicate).
>
> The check is also narrower than parsing arbitrary ES|QL: by the time we get here we are
> looking at the source string already extracted by `getIndexPatternFromESQLQuery` in
> `metrics_grid.tsx`, so the only thing left to decide is "did the user point at one thing,
> or several / a pattern?". The two-`includes` test does that and the rationale is
> captured in the function-doc above. Open to extracting it into `kbn-esql-utils` if you'd
> rather make it shared, but I didn't want to scope-creep this PR.

### Reply to comment 2
> Yes, that's exactly the change — and intentional. METRICS_INFO returns the parent data
> stream name even when it's invoked against a single backing index, so reusing
> `metricItem.dataStream` widens the chart's scope back out to the whole data stream and
> re-introduces the cross-backing-index field-type conflicts METRICS_INFO had already
> filtered out at the narrower scope. The `verification_exception` you reported in
> https://github.com/elastic/kibana/issues/262360#issuecomment-4334258317 is exactly that
> scope mismatch.
>
> Glob (`logs-*`) and comma-list sources still fall back to `metricItem.dataStream` so
> per-data-stream chart isolation is preserved for multi-DS patterns. The
> `originalSource (issue #262360)` describe block in `create_esql_query.test.ts` covers
> concrete-source-overrides-dataStream, glob-falls-back, comma-list-falls-back, undefined,
> and empty-string. Tagging @miguel-sanchez-elastic for product sign-off on the
> single-backing-index behavior.
