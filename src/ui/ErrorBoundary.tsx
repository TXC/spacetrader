import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import shared from './shared.module.css';

// Shown in place of the game when drawing it fails, so the page is never left blank.
// React offers this only to class components.
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('The game could not be drawn.', error, info.componentStack);
  }

  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div id="game-error" role="alert" className={shared.centredText}>
        <p>Something went wrong. Reload the page to continue from your last saved game.</p>
        <button id="reload" onClick={() => location.reload()}>
          Reload
        </button>
      </div>
    );
  }
}
