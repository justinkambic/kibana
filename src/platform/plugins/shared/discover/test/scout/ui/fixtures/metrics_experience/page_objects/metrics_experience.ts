/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { Locator, ScoutPage } from '@kbn/scout';
import { expect } from '@kbn/scout/ui';
import type { PaginationLocators } from './pagination';
import { createGridPagination } from './pagination';
import type { MetricsFlyout } from './flyout';
import { createFlyout } from './flyout';
import type { ChartActions } from './chart_actions';
import { createChartActions } from './chart_actions';
import type { BreakdownSelector } from './breakdown_selector';
import { createBreakdownSelector } from './breakdown_selector';
import type { ShareHelper } from './share_helper';
import { createShareHelper } from './share_helper';

export class MetricsExperiencePage {
  public readonly container: Locator;
  public readonly grid: Locator;
  public readonly fullscreen: Locator;
  public readonly cards: Locator;
  public readonly pagination: PaginationLocators;
  public readonly flyout: MetricsFlyout;
  public readonly searchButton: Locator;
  public readonly searchInput: Locator;
  public readonly emptyState: Locator;
  public readonly chartActions: ChartActions;
  public readonly breakdownSelector: BreakdownSelector;
  public readonly share: ShareHelper;
  public readonly fullscreenButton: Locator;
  private readonly page: ScoutPage;

  constructor(page: ScoutPage) {
    this.page = page;
    // metricsExperienceRendered is the outer wrapper containing header, grid, and pagination
    this.container = page.testSubj.locator('metricsExperienceRendered');
    this.grid = page.testSubj.locator('unifiedMetricsExperienceGrid');
    this.fullscreen = page.testSubj.locator('metricsGridWrapper-fullScreen');
    this.cards = this.grid.locator('[data-chart-index]');
    this.pagination = createGridPagination(this.container);
    this.flyout = createFlyout(page);
    this.chartActions = createChartActions(page);
    this.breakdownSelector = createBreakdownSelector(page);
    this.searchButton = page.testSubj.locator('metricsExperienceToolbarSearch');
    this.searchInput = page.testSubj.locator('metricsExperienceGridToolbarSearch');
    this.emptyState = page.testSubj.locator('metricsExperienceNoData');
    this.share = createShareHelper(page);
    this.fullscreenButton = page.testSubj.locator('metricsExperienceToolbarFullScreen');
  }

  public getCardByIndex(index: number): Locator {
    return this.grid.locator(`[data-chart-index="${index}"]`);
  }

  /**
   * Returns quick actions scoped to a specific card by index.
   * Quick actions (like Explore) are rendered in the hover bar inside the card.
   * Use this instead of global locators to avoid strict mode violations
   * when multiple cards have visible hover actions.
   */
  public getQuickActionsForCard(index: number): { explore: Locator } {
    const card = this.getCardByIndex(index);
    return {
      explore: card.locator(
        '[data-test-subj="embeddablePanelAction-ACTION_METRICS_EXPERIENCE_EXPLORE_IN_DISCOVER_TAB"]'
      ),
    };
  }

  public async searchMetric(term: string): Promise<void> {
    const isInputVisible = await this.searchInput.isVisible();
    if (!isInputVisible) {
      await this.searchButton.click();
    }
    await this.searchInput.fill(term);
  }

  public async clearSearch(): Promise<void> {
    await this.searchInput.clear();
  }

  public getVisibleCardCount(): Promise<number> {
    return this.cards.count();
  }

  public async toggleFullscreen(): Promise<void> {
    await this.fullscreenButton.click();
  }

  /**
   * Hovers over a metric card to reveal the panel header, then clicks the
   * context menu toggle button to open the chart actions menu.
   */
  public async openCardContextMenu(index: number): Promise<void> {
    const card = this.getCardByIndex(index);
    const menuButton = card.locator('[data-test-subj="embeddablePanelToggleMenuIcon"]');
    await card.hover();
    await menuButton.waitFor({ state: 'visible' });
    await menuButton.click();
  }

  /**
   * Opens the insights flyout by triggering "View details" from the chart
   * actions menu of the given card.
   */
  public async openInsightsFlyout(cardIndex: number): Promise<void> {
    await this.openCardContextMenu(cardIndex);
    await this.chartActions.viewDetails.click();
  }

  /**
   * Waits for the embeddable panel inside a card to signal that rendering is
   * complete via the `data-render-complete="true"` attribute set by Lens.
   */
  public async waitForCardRenderComplete(index: number): Promise<void> {
    const panel = this.getCardByIndex(index).locator(
      '[data-test-subj="embeddablePanel"][data-render-complete="true"]'
    );
    await expect(panel).toBeVisible();
  }

  private clickAttempt = 0;

  /**
   * Clicks on a chart data point in a metric card to trigger Lens's
   * click-to-filter action (appends a WHERE clause to the query).
   * Requires a breakdown dimension to be active so the click targets a
   * specific series data point.
   *
   * Scans all three color channels across the plot area to find candidate
   * click positions on data-line pixels, then clicks a different one on
   * every invocation so that the `toPass` retry loop sweeps across
   * positions until one lands within elastic-charts' ~10 px hit radius.
   * Uses `page.mouse` directly (same mechanism as the brush helper)
   * rather than `locator.click()` to avoid actionability overhead.
   */
  public async clickChartDataPoint(index: number): Promise<void> {
    const card = this.getCardByIndex(index);
    const canvas = this.getChartCanvasForCard(index);
    await canvas.waitFor({ state: 'visible' });

    const overlaySelector = '.embPanel__hoverActions, .embPanel__header';
    await card.evaluate((el, sel) => {
      el.querySelectorAll<HTMLElement>(sel).forEach((overlay) => {
        overlay.style.setProperty('pointer-events', 'none', 'important');
      });
    }, overlaySelector);

    try {
      const box = await canvas.boundingBox();
      if (!box) {
        await canvas.click();
        return;
      }

      const positions = await canvas.evaluate((cvs: HTMLCanvasElement) => {
        const ctx = cvs.getContext('2d');
        if (!ctx) return [];

        const w = cvs.width;
        const h = cvs.height;
        const dpr = w / cvs.clientWidth || 1;
        const results: Array<{ x: number; y: number }> = [];
        const seen = new Set<string>();

        const yMin = Math.round(h * 0.02);
        const yMax = Math.round(h * 0.82);

        for (let lx = Math.round(w * 0.1); lx < Math.round(w * 0.98); lx += 2) {
          for (let ly = yMin; ly < yMax; ly += 1) {
            const [r, g, b, a] = ctx.getImageData(lx, ly, 1, 1).data;
            if (a < 80) continue;
            const mx = Math.max(r, g, b);
            const mn = Math.min(r, g, b);
            if (mx === 0 || (mx - mn) / mx < 0.4) continue;

            const cssX = Math.round(lx / dpr);
            const cssY = Math.round(ly / dpr);
            const key = `${cssX},${cssY}`;
            if (!seen.has(key)) {
              seen.add(key);
              results.push({ x: cssX, y: cssY });
            }
            break;
          }
        }
        return results;
      });

      if (positions.length === 0) {
        await canvas.click();
        return;
      }

      const posIndex = this.clickAttempt % positions.length;
      this.clickAttempt++;
      const pos = positions[posIndex];

      const absX = box.x + pos.x;
      const absY = box.y + pos.y;

      await this.page.mouse.move(absX, absY);
      await this.page.mouse.down();
      await this.page.mouse.up();
    } finally {
      await card.evaluate((el, sel) => {
        el.querySelectorAll<HTMLElement>(sel).forEach((overlay) => {
          overlay.style.removeProperty('pointer-events');
        });
      }, overlaySelector);
    }
  }

  /**
   * Returns the chart canvas locator within a metric card's Lens embeddable.
   */
  public getChartCanvasForCard(index: number): Locator {
    return this.getCardByIndex(index).locator('canvas');
  }

  /**
   * Performs a brush (click-and-drag) gesture on the chart canvas within a
   * metric card. Drags from ~25% to ~75% of the canvas width horizontally.
   */
  public async brushChartInCard(index: number): Promise<void> {
    const canvas = this.getChartCanvasForCard(index);
    await canvas.waitFor({ state: 'visible' });
    const box = await canvas.boundingBox();
    if (!box) {
      throw new Error(`Could not get bounding box for chart canvas in card ${index}`);
    }
    const y = box.y + box.height / 2;
    const startX = box.x + box.width * 0.25;
    const endX = box.x + box.width * 0.75;

    await this.page.mouse.move(startX, y);
    await this.page.mouse.down();
    await this.page.mouse.move(endX, y, { steps: 10 });
    await this.page.mouse.up();
  }

  /**
   * Returns a legend item locator scoped to a specific card by matching
   * the visible text of the elastic-charts legend label.
   */
  public getLegendItemInCard(index: number, legendLabel: string): Locator {
    return this.getCardByIndex(index)
      .locator('.echLegendItem__label')
      .filter({ hasText: legendLabel });
  }

  /**
   * Opens the inspector flyout by triggering "Inspect" from the chart
   * actions menu of the given card.
   */
  public async openInspectorFlyout(cardIndex: number): Promise<void> {
    await this.openCardContextMenu(cardIndex);
    await this.getCardByIndex(cardIndex)
      .locator('[data-test-subj="embeddablePanelAction-openInspector"]')
      .click();
  }
}
