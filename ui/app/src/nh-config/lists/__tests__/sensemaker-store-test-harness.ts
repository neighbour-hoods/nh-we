import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { AppletConfig } from '@neighbourhoods/client';
import { mockContext } from './helpers';
import { MockFactory } from './mock-factory';
import { AssessmentDict } from '../../types';

export const mockAssessments: AssessmentDict = MockFactory.createAssessmentDict();
export const mockAppletConfig : {[appletInstanceId: string] : AppletConfig} = MockFactory.createAppletConfigDict(1);
export const mockAppletConfigs : {[appletInstanceId: string] : AppletConfig} = MockFactory.createAppletConfigDict(2);
export const mockFieldDefsResourceTable = MockFactory.createFieldDefsResourceTable();

@customElement('sensemaker-store-test-harness')
export class TestHarness extends LitElement {
  /**
   * Providing a context at the root element to maintain application state
   */
  
  @provide({ context: mockContext })
  // Create a mock store with the mock data
  sensemakerStore: object = MockFactory.mockStoreResponse('all')

  render() {
    return html`<slot></slot>`;
  }  
}
