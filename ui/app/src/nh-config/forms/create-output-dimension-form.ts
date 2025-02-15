import { EntryHash, EntryHashB64, decodeHashFromBase64, encodeHashToBase64 } from '@holochain/client';
import { html, css, CSSResult, PropertyValueMap } from 'lit';
import { object, string, boolean, number, ObjectSchema } from 'yup';
import {
  Dimension,
  Range,
  RangeKind,
  SensemakerStore,
  RangeKindFloat,
  RangeKindInteger,
  Method,
  Program,
} from '@neighbourhoods/client';
import { property, query, state } from 'lit/decorators.js';

import NHBaseForm from '@neighbourhoods/design-system-components/ancestors/base-form';
import NHAlert from '@neighbourhoods/design-system-components/alert';
import NHButton from '@neighbourhoods/design-system-components/button';
import NHCard from '@neighbourhoods/design-system-components/card';
import NHTooltip from '@neighbourhoods/design-system-components/tooltip';
import NHSelect from '@neighbourhoods/design-system-components/input/select';
import NHTextInput from '@neighbourhoods/design-system-components/input/text';
import NHRadioGroup from '@neighbourhoods/design-system-components/input/radiogroup';

import { MAX_RANGE_FLOAT, MAX_RANGE_INT, MIN_RANGE_FLOAT, MIN_RANGE_INT, DEFAULT_RANGE_MIN } from "..";

export default class CreateOutputDimensionMethod extends NHBaseForm {
  @property()
  sensemakerStore!: SensemakerStore;

  // Needed for input dimension selection:
  @property()
  private inputDimensions!: Array<Dimension & { dimension_eh: EntryHash }>;
  @property()
  private inputDimensionRanges!: Array<Range & { range_eh: EntryHash }>;

  // Helper to assign input dimension/range after selection
  private getInputDimensionAndRangeForOutput(dimensionEh: EntryHashB64) {
    // Find the new range so that output dimension range can be calculated
    const inputDimension = this.inputDimensions.find(
      (dimension: Dimension & { dimension_eh: EntryHash }) =>
        encodeHashToBase64(dimension.dimension_eh) === dimensionEh,
    );
    const inputRange = this.inputDimensionRanges.find(
      (range: Range & { range_eh: EntryHash }) =>
        encodeHashToBase64(range.range_eh) === encodeHashToBase64(inputDimension!.range_eh),
    ) as Range & { range_eh: EntryHash };
    return { inputDimension, inputRange };
  }

  // Range will need to be calculated or created, depending on form input
  // ...so keep it in state
  @state()
  inputRange!: Range & { range_eh: EntryHash };
  
  @property()
  private _rangeNumberType: keyof RangeKindInteger | keyof RangeKindFloat = 'Integer';
  @state()
  private _dimensionRange: Range = {
    name: '',
    kind: {
      [this._rangeNumberType]: {
        min: 0,
        max: 1,
      },
    } as any,
  };
  // ...and use a dynamic schema to validate before any creation
  private _dimensionRangeSchema = () => {
    const rangeMin = this._rangeNumberType == 'Integer' ? MIN_RANGE_INT : MIN_RANGE_FLOAT;
    const rangeMax = this._rangeNumberType == 'Integer' ? MAX_RANGE_INT : MAX_RANGE_FLOAT;

    return object({
      min: (this._rangeNumberType == 'Integer'
        ? number().integer('Must be an integer')
        : number().test('is-decimal', 'Must be a float', ((value: number) =>
            value.toString().match(/^(\-)?\d+(\.\d+)?$/)) as any)
      ).min(rangeMin, 'The lower extent of this range cannot be lower than ' + rangeMin),
      max: (this._rangeNumberType == 'Integer'
        ? number().integer('Must be an integer')
        : number().test('is-decimal', 'Must be a float', ((value: number) =>
            value.toString().match(/^\d+(\.\d+)?$/)) as any)
      )
        .min(
          DEFAULT_RANGE_MIN + 1,
          'The higher extent of this range cannot be lower than the lower extent: ' +
            DEFAULT_RANGE_MIN,
        )
        .max(rangeMax, 'The higher extent of this range cannot be higher than ' + rangeMax),
    });
  };
  // Helpers to calculate output range
  private getRangeForSumComputation(min: number, max: number): RangeKind {
    const rangeMin = this._rangeNumberType == 'Integer' ? MIN_RANGE_INT : MIN_RANGE_FLOAT;
    const rangeMax = this._rangeNumberType == 'Integer' ? MAX_RANGE_INT : MAX_RANGE_FLOAT;
    switch (true) {
      case max <= min:
        throw new Error('Invalid RangeKind limits');
      case min >= 0:
        // range is [0, x], where x is positive the output range will be [0, INF].
        //@ts-ignore
        return {
          [this._rangeNumberType]: {
            min: 0,
            max: rangeMax,
          },
        } as RangeKind;
      case min < 0 && max > 0:
        // range is [x, y], where x is negative and y is positive the output range will be [-INF, INF].
        //@ts-ignore
        return {
          [this._rangeNumberType]: {
            min: rangeMin,
            max: rangeMax,
          },
        } as RangeKind;
      default:
        // range is [x, 0], where x is negative the output range will be [-INF, 0].
        //@ts-ignore
        return {
          [this._rangeNumberType]: {
            min: rangeMin,
            max: 0,
          },
        } as RangeKind;
    }
  }
  private computeOutputDimensionRange() {
    if (!this.inputRange) return;
    if (this._model.program === 'SUM') {
      const rangeKindLimits = Object.values(this.inputRange.kind)[0];
      const { min, max } = rangeKindLimits;
      try {
        this._dimensionRange = {
          name: this._dimensionRange.name,
          kind: this.getRangeForSumComputation(min, max),
        };
        this._model.range_eh = undefined;
      } catch (error) {
        console.log('Error calculating output range: ', error);
      }
      return;
    }
    // Else it is AVG...
    this._dimensionRange = { name: this.inputRange.name, kind: this.inputRange.kind };
    this._model.range_eh = this.inputRange.range_eh;
  }

  // Lifecycle hook to trigger the calculation
  protected updated(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    if (changedProperties.has('inputDimensionRanges')) {
      let inputRange;
      if (
        typeof changedProperties.get('inputDimensionRanges') == 'undefined'
      ) {
        inputRange = this.inputDimensionRanges[0];
        if(!inputRange) return;
        this.inputRange = { name: inputRange.name, kind: inputRange.kind, range_eh: inputRange.range_eh} as Range & {range_eh: EntryHash};
        this._rangeNumberType = Object.keys(inputRange.kind)[0] as keyof RangeKindInteger | keyof RangeKindFloat;
      } 
      this.computeOutputDimensionRange();
    }
  }

  @property() submitBtn!: NHButton;
  @query('#error-alert') private _alert!: NHAlert;

  /* Concrete implementations of the abstract BaseForm interface */
  // Form schema
  protected get validationSchema(): ObjectSchema<any> {
    return object({
      name: string().min(1, 'Must be at least 1 characters').required(),
      computed: boolean().required(),

      method_name: string().min(1, 'Must be at least 1 characters').required(),
      program: string().required(),
      can_compute_live: boolean().required(),
      requires_validation: boolean().required(),
      input_dimension: string().required(), // b64 entry hash
    });
  }

  // Form model
  @state()
  protected _model: any = {
    // This model is for an atomic call (Dimension and Method) but keep it in a flat structure for now
    // outputDimension:
    name: '',
    computed: true,
    range_eh: undefined,
    // partialMethod:
    method_name: '',
    program: 'AVG',
    can_compute_live: false,
    requires_validation: false,
    input_dimension: undefined, // Will be put in array for zome call. Later we may support multiple input dimensions
    output_dimension_eh: null, // Created in the atomic fn call, leave null
  };
  
  // Form submit handler
  async handleValidSubmit() {
    return await this.createEntries();
  }

  handleInputChange(e: Event) {
    // Change handler overloads
    super.handleInputChange(e);

    const target = e.target as any;
    const inputValue = target.value;
    if(target.tagName == "NH-RADIO-GROUP") {
      this._model.program = target.value.toUpperCase();
      this.computeOutputDimensionRange();
    } else if (target.name === 'name') {
      this._model.method_name = `${inputValue}-method`;
      // Later the name will be removed from the method entry type
    } else if (target.name === 'input_dimension') {
      const { inputRange } = this.getInputDimensionAndRangeForOutput(inputValue);
      if(!inputRange) return;
      this.inputRange = { name: inputRange.name, kind: inputRange.kind, range_eh: inputRange.range_eh} as Range & {range_eh: EntryHash};
      this._rangeNumberType = Object.keys(inputRange.kind)[0] as keyof RangeKindInteger | keyof RangeKindFloat
      this.computeOutputDimensionRange();
    }
  }

  // Sad path form submit handler
  handleFormError() {
    this._alert!.type == 'danger';
    this._alert.openToast();
    this.submitBtn.loading = false;
    this.submitBtn.requestUpdate("loading");
  }

  async reset() {
    super.reset();

    this.submitBtn.loading = false;
    await this.submitBtn.updateComplete;
  }

  async createEntries() {
    this._dimensionRangeSchema()
      .validate(this._dimensionRange.kind[this._rangeNumberType])
      .catch(e => {
        console.error('Range validation error :>> ', e, this._dimensionRange);
      })
      .then(async validRange => {
        if (validRange) {
          this.submitBtn.loading = true;
          this.submitBtn.requestUpdate('loading');
          
          // Create range if needed
          let range_eh;
          if(this._model.range_eh) {
            range_eh = this._model.range_eh
          } else {
            try {
              range_eh = (await this.sensemakerStore.createRange(this._dimensionRange)).entryHash;
            } catch (error) {
              console.error('Range creation error :>> ', error);
            }
          }

          // Create dimension and method atomically
          const input : {
            outputDimension: Dimension;
            partialMethod: Partial<Method>;
          } = {
            outputDimension: {
              name: this._model.name,
              computed: this._model.computed,
              range_eh: range_eh,
            },
            partialMethod: {
              name: this._model.method_name,
              //@ts-ignore
              program: { [this._model.program == 'AVG' ? 'Average' : 'Sum']: null } as Program,
              can_compute_live: this._model.can_compute_live,
              requires_validation: this._model.requires_validation,
              input_dimension_ehs: [decodeHashFromBase64(this._model.input_dimension)],
              output_dimension_eh: undefined
            }
          };
          let result;
          try {
            result = await this.sensemakerStore.createOutputDimensionAndMethodAtomically(input);
          } catch (error) {
            console.error('Dimension and method creation error :>> ', error);
          }
          const { outputDimension, method } = result;
          
          await this.updateComplete;
          this.dispatchEvent(
            new CustomEvent('dimension-created', {
              detail: {
                dimensionEh: outputDimension.entryHash,
                dimensionType: "output",
                dimension: input.outputDimension,
              },
              bubbles: true,
              composed: true,
            }),
          );
          this.dispatchEvent(
            new CustomEvent('form-submitted', {
              bubbles: true,
              composed: true,
            }),
          );
        } else {
          console.error('Range was not calculated correctly')
        }
      });
  }

  render() {
    return html`
    ${this.inputDimensions && this.inputDimensions.length > 0 ? html`<form>
        <nh-tooltip .visible=${this.shouldShowValidationErrorForField('name')} .text=${this.getErrorMessage('name')} .variant=${"danger"}>
          <nh-text-input
          .errored=${this.shouldShowValidationErrorForField('name')}
            .size=${"medium"}
            slot="hoverable"
            .label=${"Dimension Name"}
            .name=${"name"}
            .placeholder=${"Enter a dimension name"}
            .required=${true}
            .value=${this._model.name}
            @change=${(e: CustomEvent) => this.handleInputChange(e)}
          ></nh-text-input>
        </nh-tooltip>

        <nh-tooltip class="tooltip-overflow" .visible=${this.shouldShowValidationErrorForField('input_dimension')} .text=${this.getErrorMessage('input_dimension')} .variant=${"danger"}>
          <nh-select
            .errored=${this.shouldShowValidationErrorForField('input_dimension')}
            .size=${"medium"}
            slot="hoverable"
            .required=${true}
            id="choose_input_dimension"
            name="input_dimension"
            .placeholder=${"Select an input dimension"}
            .label=${"Input dimension"}
            @change=${this.handleInputChange}
            .options=${this.inputDimensions
              .filter(dimension => !dimension.computed)
              .map(
                (dimension) => ({
                  label: dimension.name,
                  value: encodeHashToBase64(dimension.dimension_eh),
                })
              )
            }
          >
          </nh-select>
        </nh-tooltip>
            
        <nh-radio-group
          @change=${(e) => this.handleInputChange(e)}
          .defaultValue=${"AVG"}
          .label=${'Select an option'}
          .value=${this._model.program}
          .options=${["AVG", "SUM"]}
        >
        </nh-radio-group>
      </form>`
      : html`<nh-alert
              style="margin-top: 1rem;"
              .type=${"neutral"}
              .closable=${false}
              .title=${"You have not created any input dimensions"}
              .description=${"Click 'Add' to create an input dimension first"}>
            </nh-alert>`}
      <nh-alert
        id="error-alert"
        .type=${"danger"}
        .closable=${false}
        .open=${false}
        .isToast=${true}
        .title=${"There was an error!"}
        .description=${"Look at the console"}>
      </nh-alert>
    `;
  }

  static elementDefinitions = {
    'nh-button': NHButton,
    'nh-card': NHCard,
    'nh-alert': NHAlert,
    'nh-select': NHSelect,
    "nh-text-input": NHTextInput,
    "nh-tooltip": NHTooltip,
    'nh-radio-group': NHRadioGroup,
  };

  static get styles() {
    return [
      ...(super.styles as CSSResult[]),
      css`
        /* Layout */
        :host {
          justify-content: center;
          color: var(--nh-theme-fg-default);
          max-width: 100%;
          width: 100%;
        }

        form {
          padding: 0;
          margin: calc(1px * var(--nh-spacing-md)) 0;
          gap: calc(1px * var(--nh-spacing-md));
          display: flex;
          flex-direction: column
        }

        /* Bugfix for custom select */
        .tooltip-overflow {
          --select-height: calc(2 * 1.5px * var(--nh-spacing-3xl) - 3px); /* accounts for the label (2*) and borders (-3px) */
          overflow: inherit;
          max-height: var(--select-height);
        }
      `,
    ];
  }
}
