import { AlertHost } from '../../ui/AlertHost.tsx';
import { mountReact } from './mountReact.ts';

// In the tests the alert host is mounted once, off the page, and shared by every game a
// test starts; each alert attaches itself to the page body.
let mounted = false;
export function mountAlertHost() {
  if (mounted) return;
  mounted = true;
  mountReact(document.createElement('div'), <AlertHost />);
}
