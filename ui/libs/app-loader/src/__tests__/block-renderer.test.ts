import '@webcomponents/scoped-custom-element-registry'

import { describe, test } from 'vitest'
import { fixture, html as testHtml, expect } from '@open-wc/testing'

import { ScopedRegistryHost } from "@lit-labs/scoped-registry-mixin"
import { html, LitElement } from "lit"
import { NHDelegateReceiver, Constructor } from "@neighbourhoods/client"
import { BlockRenderer } from '../block-renderer'
import useBlockRendererMemo from '../block-renderer/update-block-renderer-component'

interface TestDelegate {
  getThing(): string
}

class TestComponent extends ScopedRegistryHost(LitElement) implements NHDelegateReceiver<TestDelegate> {
  _delegate: TestDelegate | null = null

  set nhDelegate(delegate: TestDelegate) {
    this._delegate = delegate
    this.requestUpdate()
  }

  render() {
    return this._delegate ? html`<button>${this._delegate.getThing()}</button>` : html`Loading...`
  }
}

class TestComponent2 extends ScopedRegistryHost(LitElement) implements NHDelegateReceiver<TestDelegate> {
  _delegate: TestDelegate | null = null

  set nhDelegate(delegate: TestDelegate) {
    this._delegate = delegate
    this.requestUpdate()
  }

  render() {
    return this._delegate ? html`<p>A second ${this._delegate.getThing()}</p>` : html`Loading...`
  }
}

class TestRenderer extends BlockRenderer<TestDelegate> {}

customElements.define('block-renderer', TestRenderer)

const loading = '<div id="compRoot"><b>L&nbsp;O&nbsp;A&nbsp;D&nbsp;I&nbsp;N&nbsp;G&nbsp;.&nbsp;.&nbsp;.</b></div>'

describe('BlockRenderer', () => {
  const initialRender = async (theHTML) => {
    return await fixture(theHTML)
  }

  describe('given a TestComponent and a TestDelegate ', () => {

    test(`should instantiate a TestComponent as a scoped child-elem and pass in the delegate`, async () => {
      const delegate: TestDelegate = {
        getThing() {
          return "Test!"
        }
      }
      const harness = await initialRender(testHtml`<div>
        <block-renderer .component=${TestComponent} .nhDelegate=${delegate}></block-renderer>
      </div>`)

      const children = harness.querySelectorAll('block-renderer')

      expect(children.length).to.equal(1)
      expect(children[0].shadowRoot?.querySelector('child-elem')).shadowDom.to.equal('<button>Test!</button>')
    })

  })

  describe('given a TestComponent without a TestDelegate', () => {

    test(`should display loading`, async () => {
      const delegate: TestDelegate = {
        getThing() {
          return "Test!"
        }
      }
      const harness = await initialRender(testHtml`<div>
        <block-renderer .component=${TestComponent}></block-renderer>
      </div>`)

      const children = harness.querySelectorAll('block-renderer')

      expect(children.length).to.equal(1)
      expect(children[0]).shadowDom.to.equal(loading)
    })

  })

  describe('given a TestDelegate without a TestComponent', () => {

    test(`should display loading`, async () => {
      const delegate: TestDelegate = {
        getThing() {
          return "Test!"
        }
      }
      const harness = await initialRender(testHtml`<div>
        <block-renderer .nhDelegate=${delegate}></block-renderer>
      </div>`)

      const children = harness.querySelectorAll('block-renderer')

      expect(children.length).to.equal(1)
      expect(children[0]).shadowDom.to.equal(loading)
    })

  })

})

describe('Updater', () => {
  const initialRender = async (theHTML) => {
    return await fixture(theHTML)
  }

  describe('given a TestComponent and a BlockRenderer component updater, (instantiated with a TestDelegate and the registered block renderer CustomElement)', () => {
    const delegate: TestDelegate = {
      getThing() {
        return "Test!"
      }
      
    }
    const updater = useBlockRendererMemo(delegate, customElements.get('block-renderer') as Constructor<BlockRenderer<TestDelegate>>)

    test(`should instantiate a TestComponent as a scoped element and render the component`, async () => {
      const harness = await initialRender(
        testHtml`
          <div>
            ${updater(TestComponent)}
          </div>`
      )
      const children = harness.querySelectorAll('div > *'); // It is no longer a named block-renderer component 

      expect(children.length).to.equal(1)
      expect(!!(harness.querySelector('div > *'))!.renderRoot.querySelector('*').textContent.match(delegate.getThing())).to.equal(true)
    })

    test(`when I render with another component it should instantiate a TestComponent as a scoped element and render the new component`, async () => {
      const harness = await initialRender(
        testHtml`
          <div>
            ${updater(TestComponent2)}
          </div>`
      )
      if (global.gc) { // NOTE: I was unable to get manual GC working but I leave this here as an indicator for possible future test coverage
        global.gc();
      }
      const children = harness.querySelectorAll('div > *'); // It is no longer a named block-renderer component 

      expect(children.length).to.equal(1)
      expect(!!(harness.querySelector('div > *'))!.renderRoot.querySelector('*').textContent.match("A second " + delegate.getThing())).to.equal(true)
    })

  })

})
