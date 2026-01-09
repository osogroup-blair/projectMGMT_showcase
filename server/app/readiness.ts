// Shared readiness state to track when app is fully initialized
// This avoids circular imports between index.ts and vite.ts/static.ts

let isAppReady = false;

export function setAppReady(ready: boolean) {
  isAppReady = ready;
}

export function isApplicationReady() {
  return isAppReady;
}
