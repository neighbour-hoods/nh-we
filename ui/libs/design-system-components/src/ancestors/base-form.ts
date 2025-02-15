import { CSSResult, LitElement, css } from 'lit';
import { state } from 'lit/decorators.js';
import { ValidationError, ObjectSchema } from 'yup';
import { NHComponent } from './base';

export abstract class NHBaseForm extends NHComponent {
  @state() protected errors: Record<string, string> = {};
  @state() protected touched: Record<string, boolean> = {};
  @state() protected formWasSubmitted: boolean = false;
  @state() protected _model: object = {};
  @state() protected _formErrorMessage: string = 'An error';

  // Create a backup model for the purpose of resetting the form generically.
  @state() protected _defaultModel: typeof this._model = {};

  connectedCallback(): void {
    super.connectedCallback();

    this._defaultModel = { ...this._model };

    this.resetTouchedState();
  }

  protected async reset() {
    this._model = {...this._defaultModel};
    this.formWasSubmitted = false;
    this.errors = {};
    this.resetTouchedState();
    this.resetUntouchedFields();
    this.resetInputs();
    await this.updateComplete
  }

  // Abstract method to define schema in derived classes
  protected abstract get validationSchema(): ObjectSchema<any>;
  
  protected handleInputChange(e: Event) {
    let name, value;
    let target = e.target as any;
    if(target.tagName === 'SL-RADIO' || target.tagName === 'OPTION') {
      //@ts-ignore
      name = target.parentElement.name || target.parentElement.dataset.name
      value = target.value;
    } else if(target.tagName === 'NH-SELECT-AVATAR') {
      name = (target as any).name;
      value = (e as any).detail.value;
      console.log('name,value :>> ', name,value);
    } else {
      //@ts-ignore
      name = target.name || target.dataset.name; // Fallback to dataset for name
      value = target.value;
    }
    
    this.touched[name as string] = true;
    //@ts-ignore
    this._model[name as keyof this] = value;
    this.validateField(name as string, value);
  }

  // Abstract method to handle successful form submission action
  protected abstract handleValidSubmit(): void;

  // Abstract method to handle unsuccessful form submission action
  protected abstract handleFormError(): void;

  protected async handleSubmit(e?: Event) {
    e?.preventDefault && e.preventDefault();
    const isValid = await this.validateForm();
    this.formWasSubmitted = true;
    if (this.isFormUntouched()) { 
      await this.highlightUntouchedFields()
    }
    else if (isValid) {
      // Form is valid, proceed with submission logic
      try {
        await this.handleValidSubmit();
      } catch (error: any) {
        this._formErrorMessage = error.message;
        this.handleFormError()
        console.error('Error while submitting form: ', error)
      }
    } else {
      console.warn('An error was thrown in form validation. Check that it was handled correctly.');
    }
  }

  protected async validateField(name: string, value: any) {
    try {
      await this.validationSchema.validateAt(name, {[name]: value});
      this.errors = { ...this.errors, [name]: '' }; // Clear error for the field
    } catch (error) {
      if (error instanceof ValidationError) {
        this.errors = { ...this.errors, [name]: error.message };
      }
    }
  }

  protected async validateForm() {
    try {
      await this.validationSchema.validate(this._model, { abortEarly: false });
      this.errors = {}; // Clear all errors
      return true;
    } catch (error) {
      if (error instanceof ValidationError) {
        const newErrors = error.inner.reduce((acc, curr) => {
          acc[curr.path as string] = curr.message;
          return acc;
        }, {} as Record<string, string>);
        this.errors = newErrors;
        // Mark all fields as touched
        error.inner.forEach(err => { if(!this.errors[err.path as string].includes('required')) this.touched[err.path as string] = true});
      }
      return false;
    }
  }

  protected resetInputs(): void {
    ((this as LitElement).renderRoot.querySelectorAll('nh-text-input, nh-radio-group, nh-select, nh-textarea') as any)?.forEach((input: any) => {
      input?.reset();
    })
  }

  protected resetUntouchedFields(): void {
    ((this as LitElement).renderRoot.querySelectorAll('.untouched') as any)?.forEach((input: any) => {
      input.classList.remove('untouched');
    })
  }

  protected resetTouchedState(): void {
    //@ts-ignore
    const zip = (a, b) => a.map((k, i) => [k, b[i]]);
    this.touched = Object.fromEntries(zip(Object.keys(this._model), Object.keys(this._model).map( _ => false)));
  }

  highlightUntouchedFields() {
    ((this as LitElement).renderRoot.querySelectorAll('nh-text-input, nh-radio-group, nh-select, nh-textarea') as any)?.forEach((input: any) => {
      if(this.touched[input?.name || input!.dataset.name || ''] === false) input.classList.add('untouched');
      // Fields not in the model will fail escape early from the above
    })
  }

  enableAllFields() {
    ((this as LitElement).renderRoot.querySelectorAll('sl-input, nh-radio-group, nh-select, nh-textarea') as any)?.forEach((input: any) => {
      if(input.disabled = true) input.disabled = false;
    })
  }

  protected isFormUntouched() {
    //@ts-ignore
    return Object.entries(this.touched).some(([name, touched]) => !touched && this.renderRoot.querySelector('*[name="' + name + '"]')?.required == true);
  }

  protected getErrorMessage(inputName: string): string | undefined {
    return this.shouldShowValidationErrorForField(inputName) ? this.errors[inputName] : undefined;
  }

  protected shouldShowValidationErrorForField(inputName: string): boolean {
    return this.formWasSubmitted && (this.errors[inputName] && !(this.errors[inputName] == '')) as boolean
  }  
  
  static styles: CSSResult[] = [
    super.styles as CSSResult,
    css`
      :host {
        display: flex;
      }
  `];
}

export default NHBaseForm;