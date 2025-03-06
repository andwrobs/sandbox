class MicroAppBElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.counter = 0;
    this.context = {}; // Initialize context as a class property
  }

  connectedCallback() {
    // Get context from parent if available
    try {
      this.context = JSON.parse(this.getAttribute('app-context') || '{}');
    } catch (e) {
      console.error('Failed to parse app context', e);
      this.context = {}; // Ensure context is an object even if parsing fails
    }

    this.render();
    this.addEventListeners();
  }

  addEventListeners() {
    // Add event listeners after rendering
    const incrementBtn = this.shadowRoot.getElementById('incrementBtn');
    if (incrementBtn) {
      // Remove existing listeners to prevent duplicates
      incrementBtn.replaceWith(incrementBtn.cloneNode(true));
      
      // Add fresh event listener
      this.shadowRoot.getElementById('incrementBtn').addEventListener('click', () => {
        this.counter++;
        this.render();
        this.addEventListeners(); // Re-attach event listeners after re-rendering
        
        // Notify parent app
        this.dispatchEvent(new CustomEvent('micro-app-action', {
          bubbles: true,
          composed: true,
          detail: {
            source: 'micro-app-b',
            action: 'counter-changed',
            counter: this.counter
          }
        }));
      });
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          box-sizing: border-box;
        }
        .micro-app {
          display: flex;
          flex-direction: column;
          padding: 20px;
          border: 2px solid #ff5722;
          border-radius: 8px;
          margin: 0;
          font-family: Arial, sans-serif;
          height: 100%;
          box-sizing: border-box;
          overflow: auto;
        }
        h2 {
          color: #ff5722;
          margin-top: 0;
        }
        .counter {
          font-size: 24px;
          font-weight: bold;
          margin: 20px 0;
        }
        button {
          background-color: #ff5722;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          align-self: flex-start;
        }
        button:hover {
          background-color: #e64a19;
        }
        .spacer {
          flex: 1;
        }
      </style>
      <div class="micro-app">
        <h2>Micro App B</h2>
        <p>This is a standalone web component with its own state.</p>
        <p>Parent App: ${this.context.parentApp || 'Unknown'}</p>
        <p>Loaded at: ${this.context.timestamp || new Date().toISOString()}</p>
        <div class="counter">Counter: ${this.counter}</div>
        <button id="incrementBtn">Increment Counter</button>
        <div class="spacer"></div>
      </div>
    `;
  }

  disconnectedCallback() {
    // Clean up event listeners
    const incrementBtn = this.shadowRoot.getElementById('incrementBtn');
    if (incrementBtn) {
      incrementBtn.removeEventListener('click', null);
    }
  }

  // API method that can be called from the parent application
  resetCounter() {
    this.counter = 0;
    this.render();
    this.addEventListeners();
    return this.counter;
  }
}

// Register the custom element
customElements.define('micro-app-b-root', MicroAppBElement);

console.log('Micro App B Web Component registered');