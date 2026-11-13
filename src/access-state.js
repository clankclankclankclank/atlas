export const lockEvent = 'atlas-lock-request';
export function lockAtlas() { window.dispatchEvent(new Event(lockEvent)); }
