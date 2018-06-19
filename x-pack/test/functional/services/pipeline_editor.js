/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import expect from 'expect.js';
import { props as propsAsync } from 'bluebird';
// import { highlight } from 'lowlight';

export function PipelineEditorProvider({ getService }) {
  const aceEditor = getService('aceEditor');
  const testSubjects = getService('testSubjects');

  // test subject selectors
  const SUBJ_CONTAINER = 'pipelineEdit';
  const getContainerSubjForId = id => `pipelineEdit-${id}`;
  const SUBJ_INPUT_ID = 'pipelineEdit inputId';
  const SUBJ_INPUT_DESCRIPTION = 'pipelineEdit inputDescription';
  const SUBJ_UI_ACE_PIPELINE = 'pipelineEdit acePipeline';

  const SUBJ_INPUT_WORKERS = 'pipelineEdit inputWorkers';
  const SUBJ_INPUT_BATCH_SIZE = 'pipelineEdit inputBatchSize';
  const SUBJ_SELECT_QUEUE_TYPE = 'pipelineEdit selectQueueType';
  const SUBJ_INPUT_QUEUE_MAX_BYTES_NUMBER = 'pipelineEdit inputQueueMaxBytesNumber';
  const SUBJ_SELECT_QUEUE_MAX_BYTES_UNITS = 'pipelineEdit selectQueueMaxBytesUnits';
  const SUBJ_INPUT_QUEUE_CHECKPOINT_WRITES = 'pipelineEdit inputQueueCheckpointWrites';

  const SUBJ_BTN_SAVE = 'pipelineEdit btnSavePipeline';
  const SUBJ_BTN_CANCEL = 'pipelineEdit btnCancel';
  const SUBJ_BTN_DELETE = 'pipelineEdit btnDeletePipeline';
  const SUBJ_LNK_BREADCRUMB_MANAGEMENT = 'breadcrumbs lnkBreadcrumb0';
  const SUBJ_CONFIRM_MODAL_TEXT = 'confirmModalBodyText';

  const DEFAULT_INPUT_VALUES = {
    id: '',
    description: '',
    pipeline: [
      'input {',
      '}',
      'filter {',
      '}',
      'output {',
      '}',
    ].join('\n'),
    workers: '',
    batchSize: 125,
    queueType: 'memory',
    queueMaxBytesNumber: 1,
    queueMaxBytesUnits: 'gb',
    queueCheckpointWrites: 1024
  };

  return new class PipelineEditor {
    async clickSave() {
      await testSubjects.click(SUBJ_BTN_SAVE);
    }
    async clickCancel() {
      await testSubjects.click(SUBJ_BTN_CANCEL);
    }
    async clickDelete() {
      await testSubjects.click(SUBJ_BTN_DELETE);
    }
    async clickManagementBreadcrumb() {
      await testSubjects.click(SUBJ_LNK_BREADCRUMB_MANAGEMENT);
    }

    async setId(value) {
      await testSubjects.setValue(SUBJ_INPUT_ID, value);
    }
    async setDescription(value) {
      await testSubjects.setValue(SUBJ_INPUT_DESCRIPTION, value);
    }
    async setPipeline(value) {
      await aceEditor.setValue(SUBJ_UI_ACE_PIPELINE, value);
    }
    async setPatternInput(value) {
      await aceEditor.setValue(SUBJ_CONTAINER, value);
    }
    async setWorkers(value) {
      await testSubjects.setValue(SUBJ_INPUT_WORKERS, value);
    }
    async setBatchSize(value) {
      await testSubjects.setValue(SUBJ_INPUT_BATCH_SIZE, value);
    }
    async setQueueType(value) {
      await testSubjects.click(`${SUBJ_SELECT_QUEUE_TYPE}-${value}`);
    }
    async setQueueMaxBytesNumber(value) {
      await testSubjects.setValue(SUBJ_INPUT_QUEUE_MAX_BYTES_NUMBER, value);
    }
    async setQueueMaxBytesUnits(value) {
      await testSubjects.click(`${SUBJ_SELECT_QUEUE_MAX_BYTES_UNITS}-${value}`);
    }
    async setQueueCheckpointWrites(value) {
      await testSubjects.setValue(SUBJ_INPUT_QUEUE_CHECKPOINT_WRITES, value);
    }

    /**
     *  Assert that the editor is visible on the page and
     *  throw a meaningful error if not
     *  @return {Promise<undefined>}
     */
    async assertExists() {
      if (!await testSubjects.exists(SUBJ_CONTAINER)) {
        throw new Error('Expected to find the pipeline editor');
      }
    }

    /**
     *  Assert that the editor is visible on the page and is
     *  working on a specific id
     *  @param  {string} id
     *  @return {Promise<undefined>}
     */
    async assertEditorId(id) {
      if (!await testSubjects.exists(getContainerSubjForId(id))) {
        throw new Error(`Expected editor id to be "${id}"`);
      }
    }

    /**
     *  Assert that the editors fields match the defaults
     *  @return {Promise<undefined>}
     */
    async assertDefaultInputs() {
      await this.assertInputs(DEFAULT_INPUT_VALUES);
    }

    /**
     *  Assert that the editors fields match the passed values
     *  @param  {Object} expectedValues - must have id, description, and pipeline keys
     *  @return {Promise<undefined>}
     */
    async assertInputs(expectedValues) {
      const values = await propsAsync({
        id: testSubjects.getProperty(SUBJ_INPUT_ID, 'value'),
        description: testSubjects.getProperty(SUBJ_INPUT_DESCRIPTION, 'value'),
        pipeline: aceEditor.getValue(SUBJ_UI_ACE_PIPELINE),
        workers: testSubjects.getProperty(SUBJ_INPUT_WORKERS, 'value'),
        batchSize: testSubjects.getProperty(SUBJ_INPUT_BATCH_SIZE, 'value'),
        queueType: testSubjects.getProperty(SUBJ_SELECT_QUEUE_TYPE, 'value'),
        queueMaxBytesNumber: testSubjects.getProperty(SUBJ_INPUT_QUEUE_MAX_BYTES_NUMBER, 'value'),
        queueMaxBytesUnits: testSubjects.getProperty(SUBJ_SELECT_QUEUE_MAX_BYTES_UNITS, 'value'),
        queueCheckpointWrites: testSubjects.getProperty(SUBJ_INPUT_QUEUE_CHECKPOINT_WRITES, 'value')
      });

      expect(values).to.eql(expectedValues);
    }

    async assertNoDeleteButton() {
      if (await testSubjects.exists(SUBJ_BTN_DELETE)) {
        throw new Error('Expected there to be no delete button');
      }
    }

    async assertPatterInputSyntaxHighlighting(expectedHighlights, filterClasses) {
      const patternInputElement = await testSubjects.find(SUBJ_CONTAINER);
      let highlightedElements = await patternInputElement.findAllByXpath('.//div[@class="ace_line"]/*');

      highlightedElements = await Promise.all(highlightedElements.map(async (element) => {
        const highlightClass = await element.getAttribute('class');
        const highlightedContent = await element.getVisibleText();

        return {
          highlightClass,
          highlightedContent
        };
      }));

      if (filterClasses) {
        highlightedElements = highlightedElements.filter(({ highlightClass }) =>
          filterClasses.some(filterClass => filterClass !== highlightClass)
        );
      }

      expect(highlightedElements.length).to.be(expectedHighlights.length);
      highlightedElements.forEach(({ highlightClass, highlightedContent }, index) => {
        const expectedHighlight = expectedHighlights[index];
        const expectedHighlightClass = `ace_${expectedHighlight.token}`;
        const expectedHighlightedContent = expectedHighlight.content;

        expect(highlightClass).to.be(expectedHighlightClass);
        expect(highlightedContent).to.be(expectedHighlightedContent);
      });
    }

    assertUnsavedChangesModal() {
      return testSubjects.exists(SUBJ_CONFIRM_MODAL_TEXT);
    }
  };
}
