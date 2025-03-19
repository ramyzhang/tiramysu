// src/main.ts
import { Engine } from './src/engine/engine.js';
import WebGL from 'three/addons/capabilities/WebGL.js';

// entry point!
class PortfolioGame {
  private engine: Engine;
  
  constructor() {
    // Create canvas
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    this.engine = new Engine(canvas);
    
    // check if webgl is available
    if (WebGL.isWebGL2Available()) {
        // initialize game
        this.init();
    } else {
        const warning = WebGL.getWebGL2ErrorMessage();
        document.body.appendChild(warning);
    }
  }
  
  private async init(): Promise<void> {
    try {
      this.showLoading(true);
      await this.engine.init();
      this.showLoading(false);
    } catch (error) {
      console.error('failed to initialize game:', error);
      this.showError('failed to load the game. please try again later.');
    }
  }
  
  private showLoading(visible: boolean): void {
    // Toggle loading screen visibility
    const loadingElement = document.getElementById('loading-screen');
    if (loadingElement) {
      loadingElement.style.display = visible ? 'flex' : 'none';
    }
  }
  
  private showError(message: string): void {
    // Display error message
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    document.body.appendChild(errorElement);
  }
}

// Start the game when the DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  new PortfolioGame();
});