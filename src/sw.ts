/// <reference lib="webworker" />
// The service worker: keeps a copy of the built game so it starts and plays with no
// connection. The build turns this file into sw.js and gives it the list of its files.
//
// A new build means a new list, so the browser installs a new worker. It waits until every
// tab of the game is closed before it takes over: a game in progress is never reloaded.
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

declare const self: ServiceWorkerGlobalScope & {
  // Filled in by the build: every file of this build, each with a fingerprint.
  __WB_MANIFEST: { url: string; revision: string | null }[];
};

// Store the files of this build, answer requests for them from the store, and drop the
// stored files of earlier builds.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Any address inside the game is the one page.
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));
