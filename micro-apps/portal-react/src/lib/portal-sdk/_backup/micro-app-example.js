/**
 * Example code for a micro-app to communicate with the portal
 * 
 * This file demonstrates how a micro-app can:
 * 1. Initialize communication with the portal
 * 2. Send events to the portal
 * 3. Receive events from the portal
 * 4. Show modals through the portal
 * 5. Navigate within the portal
 */

// Initialize communication with the portal
function initializePortalCommunication() {
  // Listen for messages from the portal
  window.addEventListener('message', handlePortalMessage);
  
  // Send APP_READY event to the portal
  sendMessageToPortal({
    type: 'app:ready',
    data: {
      version: '1.0.0',
      features: ['modals', 'navigation'],
      initialRoute: window.location.pathname
    },
    sourceId: 'micro-app-a', // Replace with your app ID
    timestamp: Date.now()
  });
  
  console.log('Portal communication initialized');
}

// Handle messages from the portal
function handlePortalMessage(event) {
  // Validate the message source (should be the parent window)
  if (event.source !== window.parent) return;
  
  const message = event.data;
  
  // Log all incoming messages
  console.log('Received message from portal:', message);
  
  // Handle different message types
  switch (message.type) {
    case 'app:loaded':
      console.log('App iframe loaded event received');
      // The portal has loaded our iframe, now we can send the ready event
      sendAppReadyEvent();
      break;
      
    case 'navigation:routeChanged':
      console.log('Route changed in another app or the portal');
      // Handle route changes in other parts of the application
      break;
      
    case 'custom':
      console.log('Custom message received:', message.data);
      // Handle custom messages from the portal
      break;
      
    default:
      console.log('Unhandled message type:', message.type);
  }
}

// Send APP_READY event to the portal
function sendAppReadyEvent() {
  sendMessageToPortal({
    type: 'app:ready',
    data: {
      version: '1.0.0',
      features: ['modals', 'navigation'],
      initialRoute: window.location.pathname
    },
    sourceId: 'micro-app-a', // Replace with your app ID
    timestamp: Date.now()
  });
}

// Show a modal through the portal
function showModalInPortal() {
  sendMessageToPortal({
    type: 'ui:showModal',
    data: {
      id: `modal-${Date.now()}`,
      htmlContent: `
        <div>
          <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">Hello from Micro-App</h2>
          <p>This modal is being shown through the portal!</p>
          <button id="modal-close-btn" style="background-color: #3b82f6; color: white; padding: 0.5rem 1rem; border-radius: 0.25rem; margin-top: 1rem;">Close</button>
        </div>
      `,
      displayOptions: {
        width: '400px',
        closeOnOverlayClick: true,
        showCloseButton: true
      }
    },
    sourceId: 'micro-app-a', // Replace with your app ID
    timestamp: Date.now()
  });
}

// Navigate to another route within the portal
function navigateInPortal(routePath) {
  sendMessageToPortal({
    type: 'navigation:navigate',
    data: {
      routePath,
      internal: false // Set to true for navigation within the micro-app
    },
    sourceId: 'micro-app-a', // Replace with your app ID
    timestamp: Date.now()
  });
}

// Send a message to another micro-app
function sendMessageToAnotherApp(targetAppId, messageData) {
  sendMessageToPortal({
    type: 'app:sendMessage',
    data: messageData,
    sourceId: 'micro-app-a', // Replace with your app ID
    targetId: targetAppId,
    timestamp: Date.now()
  });
}

// Helper function to send messages to the portal
function sendMessageToPortal(message) {
  window.parent.postMessage(message, '*');
  console.log('Sent message to portal:', message);
}

// Initialize when the page loads
window.addEventListener('load', initializePortalCommunication);

// Example usage in a React component:
/*
import React from 'react';

function MicroAppComponent() {
  const showModal = () => {
    // Show a modal through the portal
    showModalInPortal();
  };
  
  const navigateToAppB = () => {
    // Navigate to Micro-App B
    navigateInPortal('/micro-app-b');
  };
  
  const sendMessageToAppB = () => {
    // Send a message to Micro-App B
    sendMessageToAnotherApp('micro-app-b', {
      action: 'getData',
      requestId: Date.now()
    });
  };
  
  return (
    <div>
      <h1>Micro-App A</h1>
      <button onClick={showModal}>Show Modal</button>
      <button onClick={navigateToAppB}>Go to App B</button>
      <button onClick={sendMessageToAppB}>Send Message to App B</button>
    </div>
  );
}

export default MicroAppComponent;
*/ 