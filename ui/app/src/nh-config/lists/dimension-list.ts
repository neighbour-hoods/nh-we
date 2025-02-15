import { html, css, PropertyValueMap } from "lit";
import { property, state } from "lit/decorators.js";

import { EntryHash, encodeHashToBase64 } from "@holochain/client";
import { Dimension,  Method,  Range, RangeKind, SensemakerStore } from "@neighbourhoods/client";

import NHButton from '@neighbourhoods/design-system-components/button';
import NHCard from '@neighbourhoods/design-system-components/card';
import NHComponent from '@neighbourhoods/design-system-components/ancestors/base';

import { capitalize } from "../../elements/components/helpers/functions";
import { FieldDefinition, FieldDefinitions, Table, TableStore } from "@adaburrows/table-web-component";
import { EntryRecord } from "@holochain-open-dev/utils";

type InputDimensionTableRecord = {
  ['dimension-name']: string,
  ['range-type']: string,
  ['range-min']: number,
  ['range-max']: number,
}

type OutputDimensionTableRecord = InputDimensionTableRecord & {
  ['input-dimension-name'] : string,
  ['method-operation'] : string,
}

type DimensionTableRecord = InputDimensionTableRecord | OutputDimensionTableRecord;

export default class DimensionList extends NHComponent {  
  @property() sensemakerStore!: SensemakerStore;

  @property() dimensionType: "input" | "output" = "input";

  @state() tableStore!: TableStore<DimensionTableRecord>;

  @state() private _dimensionEntries!: Array<Dimension & { dimension_eh: EntryHash }>;

  @state() private _rangeEntries!: Array<Range & { range_eh: EntryHash }>;
  
  @state() private _methodEntries!: Array<Method>;

  async fetchDimensionEntries() {
    try {
      const entryRecords = await this.sensemakerStore.getDimensions();
      this._dimensionEntries = entryRecords.map(entryRecord => {
        return {
          ...entryRecord.entry,
          dimension_eh: entryRecord.entryHash
        }
      })
    } catch (error) {
      console.log('Error fetching dimension details: ', error);
    }
  }

  async fetchRangeEntriesFromHashes(rangeEhs: EntryHash[]) {
    let response;
    try {
      response = await Promise.all(rangeEhs.map(eH => this.sensemakerStore.getRange(eH)))
    } catch (error) {
      console.log('Error fetching range details: ', error);
    }
    this._rangeEntries = response.map((entryRecord) => ({...entryRecord.entry, range_eh: entryRecord.entryHash})) as Array<Range & { range_eh: EntryHash }>;
  }

  async firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>) {
    if (!!this.sensemakerStore) { // We need to fetch all global dimensions
      try {
        await this.fetchDimensionEntries();
        if(!this._dimensionEntries) return
        await this.fetchRangeEntriesFromHashes(this._dimensionEntries.map((dimension: Dimension) => dimension.range_eh));

        this._methodEntries = (await (this.sensemakerStore.getMethods()) as Array<EntryRecord<Method>>).map(eR => eR.entry);
      } catch (error) {
        console.error('Could not fetch: ', error)
      }
    }
  }

  protected updated(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    if(changedProperties.has('_dimensionEntries') || changedProperties.has('_rangeEntries') || changedProperties.has('_methodEntries')) {
      if(typeof this._rangeEntries == 'undefined') return;
      
      try {
        const tableRecords = this._dimensionEntries.filter((dimension: Dimension) => this.dimensionType == 'input' ? !dimension.computed : dimension.computed)
          .reverse()
          .map((dimension: Dimension & { dimension_eh: EntryHash; }) => {
            const range = this._rangeEntries
              .find((range: Range & { range_eh: EntryHash; }) =>
                encodeHashToBase64(range.range_eh) === encodeHashToBase64(dimension.range_eh));
                if(!range) {
                  return {
                    ['dimension-name']: dimension.name,
                    ['range-type']: 'N/A',
                    ['range-min']: 0,
                    ['range-max']: 0,
                  }
                }
            const method = (this._methodEntries || [])
              .find((method: Method) =>
                encodeHashToBase64(method.output_dimension_eh) === encodeHashToBase64(dimension.dimension_eh));
            const inputDimension = !!method 
              ? this._dimensionEntries
                .find((dimension: Dimension & { dimension_eh: EntryHash; }) =>
                  encodeHashToBase64(method.input_dimension_ehs[0]) === encodeHashToBase64(dimension.dimension_eh))
              : {};

            const [[rangeType, rangeValues]] : any = Object.entries(range?.kind as RangeKind);
            
            return {
              ['dimension-name']: dimension.name,
              ['range-type']: rangeType,
              ['range-min']: rangeValues?.min,
              ['range-max']: rangeValues?.max,
              // For output dimensions
              ['input-dimension-name']: (inputDimension as any)?.name || '',
              ['method-operation']: typeof method?.program == 'object' ? Object.keys(method.program)[0] : '',
            }
          });
        this.tableStore.records = tableRecords;
        this.requestUpdate()
      } catch (error) {
        console.log('Error mapping dimensions and ranges to table values: ', error)
      }
    }
  }

  async connectedCallback() {
    super.connectedCallback();
    
    const fieldDefs: FieldDefinitions<DimensionTableRecord> = this.dimensionType == "input"
      ? {
        'dimension-name': new FieldDefinition<DimensionTableRecord>({heading: 'Name'}),
        'range-type': new FieldDefinition<DimensionTableRecord>({heading: 'Type'}),
        'range-min': new FieldDefinition<DimensionTableRecord>({heading: 'Min'}),
        'range-max': new FieldDefinition<DimensionTableRecord>({heading: 'Max'}) }
      : {
        'dimension-name': new FieldDefinition<DimensionTableRecord>({heading: 'Name'}),
        'input-dimension-name': new FieldDefinition<DimensionTableRecord>({heading: 'Input Dimension'}),
        'range-type': new FieldDefinition<DimensionTableRecord>({heading: 'Type'}),
        'method-operation': new FieldDefinition<DimensionTableRecord>({heading: 'Operation'}),
        'range-min': new FieldDefinition<DimensionTableRecord>({heading: 'Min'}),
        'range-max': new FieldDefinition<DimensionTableRecord>({heading: 'Max'}) }

    //@ts-ignore
    this.tableStore = new TableStore({
      tableId: 'dimensions',
      fieldDefs,
      showHeader: true,
      records: []
    });
  }
  
  render() {
    return html`
      <div class="content">
        <div class="title-bar">
          <h1>${capitalize(this.dimensionType)} Dimensions</h1>
          <slot class="action" name="action-button"></slot>
        </div>  
        ${this.tableStore.records && this.tableStore.records.length > 0
          ? html`<wc-table .tableStore=${this.tableStore}></wc-table>`
          : 'No dimensions present'
        }
      </div>
    `;
  }


  static elementDefinitions = {
    "nh-button": NHButton,
    "nh-card": NHCard,
    'wc-table': Table,
  }

  static get styles() {
    return css`
      .title-bar {
        display: flex;
        justify-content: flex-end;
        align-items: center;
      }

      h1 {
        display: flex;
        margin-right: calc(1px * var(--nh-spacing-xl));
      }

      .action {
        display: flex;
        flex: 1;
      }

      :host {
        display: flex;
        flex: 1;
        justify-content: center;
        align-items: center;

        /** Global Table **/
        --table-dimensions-background-color: var(--nh-theme-bg-surface); 
        --table-dimensions-row-odd-background-color: var(--nh-theme-bg-element); 
        --table-dimensions-row-even-background-color: var(--nh-theme-bg-element); 

        --table-dimensions-cell-height: 58px;

        --table-dimensions-element-padding: 4px;
        --table-dimensions-border-spacing: calc(1px * var(--nh-spacing-sm));

        --table-dimensions-height: 100%;
        --table-dimensions-overflow-x: auto;
        --table-dimensions-overflow-y: auto;

        /* Border radius */
        --cell-radius: 5px;
        --table-dimensions-header-first-heading-border-radius: var(--cell-radius);
        --table-dimensions-header-last-heading-border-radius: var(--cell-radius);
        --table-dimensions-header-heading-border-radius: var(--cell-radius);
        --table-dimensions-body-first-cell-border-radius: var(--cell-radius);
        --table-dimensions-body-last-cell-border-radius: var(--cell-radius);
        --table-dimensions-body-cell-border-radius: var(--cell-radius);
      }
  
      .content{
        width: 100%;
      }
    `;
  }
}