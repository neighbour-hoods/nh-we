import { NHButton, NHCard, NHComponent } from "@neighbourhoods/design-system-components";
import { html, css, PropertyValueMap } from "lit";
import { Dimension, Method, Program, SensemakerStore, Range } from "@neighbourhoods/client";
import { property, query, state } from "lit/decorators.js";
import CreateDimension from "./create-dimension-form";
import { SlInput, SlRadio, SlRadioGroup, SlSelect } from "@scoped-elements/shoelace";
import { AppInfo, EntryHash, EntryHashB64, decodeHashFromBase64, encodeHashToBase64 } from "@holochain/client";
import { array, boolean, object, string } from "yup";
const sleep = (ms: number) => new Promise((r) => setTimeout(() => r(null), ms));

export default class CreateMethod extends NHComponent {
  @property()
  sensemakerStore!: SensemakerStore;

  @property()
  inputRange!: Range;
  @property()
  private inputDimensionEhs!: EntryHash[];
  @property()
  private inputDimensions!: Array<Dimension & { dimension_eh: EntryHash }>;
  @property()
  private inputDimensionRanges!: Array<Range & { range_eh: EntryHash }>;
  
  @state()
  private outputDimensionCreated: boolean = false;

  @state()
  private _computationMethod: "AVG" | "SUM" = "AVG";

  @state()
  private _program: Program = {
    Average: null
  };
  @state()
  private _method: Partial<Method> = {
    name: '',
    program: this._program,
    can_compute_live: false,
    requires_validation: false,
    input_dimension_ehs: [],
    output_dimension_eh: undefined,
  };
  
  private _methodSchema = object({
    name: string().min(1, "Must be at least 1 characters").required(),
    can_compute_live: boolean().required(),
    input_dimension_ehs: array().min(1, 'Must have an input dimension').required(),
    requires_validation: boolean().required(),
  });

  @query('create-dimension')
  private _dimensionForm;

  protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    if(typeof this.inputDimensions[0]?.dimension_eh !== 'undefined') {
      this._method.input_dimension_ehs = [this.inputDimensions[0].dimension_eh]
    }  
  }

  getInputDimensionAndRangeForOutput(dimensionEh: EntryHashB64) {
    // Find the new range so that output dimension range can be calculated
    const inputDimension = this.inputDimensions
      .find((dimension: Dimension & { dimension_eh: EntryHash; }) =>
        encodeHashToBase64(dimension.dimension_eh) === dimensionEh);
    const inputRange = this.inputDimensionRanges
      .find((range: Range & { range_eh: EntryHash; }) =>
        encodeHashToBase64(range.range_eh) === encodeHashToBase64(inputDimension!.range_eh)) as Range & { range_eh: EntryHash };
    return { inputDimension, inputRange }
  }

  onChangeValue(e: CustomEvent) {
    const inputControl = (e.target as any);
    if(!inputControl.dataset.touched) inputControl.dataset.touched = "1";
    switch (inputControl.name) {
      case 'method-name':
        this._method['name'] = inputControl.value; 
        break;
      case 'input-dimension':
        this.inputDimensionEhs = [decodeHashFromBase64(inputControl.value)];
        const { inputRange } = this.getInputDimensionAndRangeForOutput(inputControl.value);
        
        if(!inputRange) break;
        this.inputRange = { name: inputRange.name, kind: inputRange.kind, range_eh: inputRange.range_eh} as Range & {range_eh: EntryHash};
        this._dimensionForm.requestUpdate();
        break;
      default:
        this._computationMethod = inputControl.value;
        inputControl.parentElement.dataset.touched = "1";
        this._program = this._computationMethod == "AVG" ? {
          Average: null
        } : {
          Sum: null
        };
        this._method.program = this._program
        break;
    }
  }

  fetchValidationErrorText({ path, errors }: any) {
    if(errors && errors[0] == 'untouched') return path + " is required";
    return errors[0];
  }

  resetInputErrorLabels(inputs: NodeListOf<any>) {
    inputs.forEach(input => {
      input.helpText = "";
      input.nextElementSibling.style.opacity = 0;
      input.nextElementSibling.style.visibility = 'hidden';
    });
  }

  handleValidationError(err: { path: string, errors: string[] }) {
    console.log("Error validating for field: ", err.path);

    const errorDOM = this.renderRoot.querySelectorAll("label[name=" + err.path + "]")
    if(errorDOM.length == 0) return;
    errorDOM.forEach((errorLabel: any) => {
      errorLabel.style.visibility = 'visible';
      errorLabel.style.opacity = '1';
      
      const slInput : any = errorLabel.previousElementSibling;
      slInput.helpText = this.fetchValidationErrorText(err);
    })
  }

  validateIfUntouched(inputs: NodeListOf<any>) {
    let existsUntouched = false;
    inputs.forEach((input) => {
      if(input.name == 'input-dimension') return // select is already touched
      if(!input.name) { input.name = input.dataset.name  // Fix for radio-group name
      }
      if(input.dataset.touched !== "1") {
        this.handleValidationError.call(this, { path: input.name, errors: ['untouched']})
        existsUntouched = true;
      }
    });
    return existsUntouched
  }

  resetForm() {
    this._method = {
      name: '',
      program: this._program,
      can_compute_live: false,
      requires_validation: false,
      input_dimension_ehs: [this.inputDimensions[0].dimension_eh],
      output_dimension_eh: undefined,
    };
    const { inputRange } = this.getInputDimensionAndRangeForOutput(encodeHashToBase64(this.inputDimensions[0].dimension_eh))
    this.inputRange  = inputRange;

    const inputs = this.renderRoot.querySelectorAll("sl-input, sl-radio-group, select") as any;
    this.resetInputErrorLabels(inputs);
    inputs?.forEach(input => {
      delete input!.dataset.touched;
    })    
    this.outputDimensionCreated = false;
  }

  validate() {
    const inputs = this.renderRoot.querySelectorAll("sl-input, sl-radio-group, select");
    this.resetInputErrorLabels(inputs);
    const fieldsUntouched = this.validateIfUntouched(inputs);
    return fieldsUntouched;
  }

  async onSubmitDimension() {
    await this._dimensionForm.onSubmit();
    await sleep(100); // workaround to prevent errors due to CustomEvents being sync 
    await this.updateComplete;
    this.outputDimensionCreated = true;
  }

  async onSubmit() {
    if(!this.outputDimensionCreated) await this.onSubmitDimension();
    
    this._methodSchema.validate(this._method)
      .catch((e) => { this.handleValidationError.call(this, e)})
      .then(async validMethod => {
        if(typeof this._method.output_dimension_eh == 'undefined') {
          this.outputDimensionCreated = false;
          throw new Error ("Output dimension not present")
        }
        if(validMethod) {
          const methodEh = await this.createMethod()
          if(!methodEh) throw new Error ("Method could not be created")

          await this.updateComplete;
          this.dispatchEvent(
            new CustomEvent("method-created", {
              detail: { methodEh, inputDimensionEhs: this.inputDimensionEhs },
              bubbles: true,
              composed: true,
            })
          );

          await this._dimensionForm.resetForm(); 
          await this.resetForm(); 
          await this._dimensionForm.requestUpdate();
        }
      })
  }

  async createMethod() {
    try {
      const appInfo: AppInfo = await this.sensemakerStore.client.appInfo();
      const cell_id = (appInfo.cell_info['sensemaker'][1] as any).cloned.cell_id;
      const response = await this.sensemakerStore.client.callZome({
        cell_id,
        zome_name: 'sensemaker',
        fn_name: 'create_method',
        payload: this._method,
      });
      return response;
    } catch (error) {
      console.log('Error creating new method: ', error);
    }
  }

  render() {
    return html`
      <create-dimension
        .dimensionType=${"output"}
        .inputRange=${this.inputRange}
        ._computationMethod=${this._computationMethod}
        .sensemakerStore=${this.sensemakerStore}
        @dimension-created=${async (e: CustomEvent) => {
          if(e.detail.dimensionType == "output") {
            console.log('output dimension created!');
            this._method.output_dimension_eh = e.detail.dimensionEh;
            
            const needsMoreInput = this.validate();
            if(needsMoreInput) {
              this._dimensionForm.disable()
              // TODO: add UI message explaining output dimension already created/named
              return;
            }
          }
        }}
      >
        <div slot="method-computation">
          <nh-card class="nested-card" .theme=${"dark"} .textSize=${"sm"} .heading=${"Create a method:"}>
            <div class="field select">
              <label for="input-dimension" data-name="input-dimension">Select input dimension:</label>
              <select name="input-dimension" placeholder="Select an input dimension" @change=${(e) => { this.onChangeValue(e) }}>
                ${this.inputDimensions.filter(dimension => !dimension.computed).map((dimension) => html`
                    <option value=${encodeHashToBase64(dimension.dimension_eh)}>${dimension.name}</option>
                  `)
                }
              </select> <label class="error" for="input-dimension" name="input-dimension" data-name="input-dimension">⁎</label>
            </div>
            <div class="field">
              <sl-input label="Name of Method" name="method-name" data-name=${"method-name"} value=${this._method.name} @sl-input=${(e: CustomEvent) => this.onChangeValue(e)}></sl-input>
              <label class="error" for="method-name" name="method-name" data-name="method-name">⁎</label>
            </div>
            <div class="field radio">
              <label for="method" data-name="method">Choose operation:</label>
              <div style="display: flex; justify-content:space-between; align-items: center;">
                <sl-radio-group @sl-change=${(e: any) => this.onChangeValue(e)} label=${"Select an option"} data-name=${"method"} value=${this._computationMethod}>
                  <sl-radio .checked=${this._computationMethod == "AVG"} value="AVG">AVG</sl-radio>
                  <sl-radio .checked=${this._computationMethod == "SUM"} value="SUM">SUM</sl-radio>
                </sl-radio-group>
                <label class="error" for="method" name="method" data-name="method">⁎</label>
              </div>
            </div>
          </nh-card>
        </div>
      </create-dimension>
    `;
  }

  static elementDefinitions = {
    "nh-button": NHButton,
    "nh-card": NHCard,
    'create-dimension': CreateDimension,
    'sl-input': SlInput,
    'sl-radio': SlRadio,
    'sl-radio-group': SlRadioGroup,
  }

  static get styles() {
    return css`
      /* Layout */
      :host {
        display: grid;
        flex: 1;
        place-content: start;
        color: var(--nh-theme-fg-default); 
      }

      .field, .field-row {
        display: flex;
        margin-bottom: calc(1px * var(--nh-spacing-md));
      }

      /* Fields */
      fieldset {
        border: none;
        flex-direction: column;
      }

      .field.select, .field.radio {
        display: flex;
        flex-direction: column;
        gap: calc(1px * var(--nh-spacing-md));
      }

      .field.select select, .field.select select option {
        height: 2.5rem;
      }

      label:not(.error) {
        font-size: calc(1px * var(--nh-font-size-md));
      }

      sl-radio-group::part(base) {
        display: flex;
        justify-content: space-evenly;
        align-items: center;
        gap: calc(1px * var(--nh-spacing-md));
      }
      sl-radio:not(:last-of-type) {
        margin: 0;
      }

      sl-radio::part(base) {
        color: white;
      }
      
      sl-input::part(base) {
        margin: calc(1px * var(--nh-font-size-sm)) 0 calc(1px * var(--nh-font-size-md)) 0;
      }

      label.error {
        visibility: hidden;
        opacity: 0;
        align-items: center;
        padding: 0 8px;
        flex: 1;
        flex-grow: 0;
        flex-basis: 8px;
        color: var(--nh-theme-error-default); 
      }
      
    `;
  }
}