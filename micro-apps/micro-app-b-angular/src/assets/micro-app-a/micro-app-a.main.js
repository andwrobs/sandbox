class MicroApp1Element extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }
  
    connectedCallback() {
      // Get context from parent if available
      let context = {};
      try {
        context = JSON.parse(this.getAttribute('app-context') || '{}');
      } catch (e) {
        console.error('Failed to parse app context', e);
      }
  
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;
            padding: 0;
            margin: 0;
            font-family: Arial, sans-serif;
            box-sizing: border-box;
          }
          h2 {
            color: #3f51b5;
            margin-top: 0;
            padding: 15px 20px;
            margin: 0;
            border-bottom: 2px solid #3f51b5;
          }
          .info {
            background-color: #e8eaf6;
            padding: 20px;
            flex: 1;
            overflow: auto;
            margin: 0;
          }
          button {
            background-color: #3f51b5;
            color: white;
            border: none;
            padding: 12px 20px;
            cursor: pointer;
            margin: 0;
            width: 100%;
          }
          button:hover {
            background-color: #303f9f;
          }
          .micro-app {
            display: flex;
            flex-direction: column;
            height: 100%;
            border: 2px solid #3f51b5;
            border-radius: 8px;
            overflow: hidden;
          }
        </style>
        <div class="micro-app">
          <h2>Micro App 1</h2>
          <div class="info">
            <p>This is a standalone web component loaded dynamically by the app shell.</p>
            <p>Parent App: ${context.parentApp || 'Unknown'}</p>
            <p>Loaded at: ${context.timestamp || new Date().toISOString()}</p>
          </div>
          <button id="actionBtn">Trigger Action</button>
        </div>
      `;
  
      // Add event listeners
      this.shadowRoot.getElementById('actionBtn').addEventListener('click', () => {
        // Dispatch an event that the parent app can listen to
        this.dispatchEvent(new CustomEvent('micro-app-action', {
          bubbles: true,
          composed: true,
          detail: {
            source: 'micro-app-a',
            action: 'button-click',
            timestamp: new Date().toISOString()
          }
        }));
      });
    }
  
    disconnectedCallback() {
      // Clean up any event listeners or resources
      const actionBtn = this.shadowRoot.getElementById('actionBtn');
      if (actionBtn) {
        actionBtn.removeEventListener('click', null);
      }
    }
  
    // API method that can be called from the parent application
    updateData(data) {
      const infoDiv = this.shadowRoot.querySelector('.info');
      if (infoDiv && data) {
        const newParagraph = document.createElement('p');
        newParagraph.textContent = `Updated data: ${JSON.stringify(data)}`;
        infoDiv.appendChild(newParagraph);
      }
    }
  }
  
  // Register the custom element
  customElements.define('micro-app-a-root', MicroApp1Element);
  
  console.log('Micro App 1 Web Component registered');