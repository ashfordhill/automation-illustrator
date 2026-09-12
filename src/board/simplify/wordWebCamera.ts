/**
 * Tile camera remembered while the word-web is up. Lives outside Board so
 * Before → After remounts cannot overwrite it with the fitted web camera.
 */
import type { Viewport } from "@xyflow/react";

let tileCamera: Viewport | null = null;
let webFitted = false;

export function rememberTileCamera(viewport: Viewport) {
  if (!tileCamera) tileCamera = { ...viewport };
}

export function restoreTileCamera(): Viewport | null {
  const stored = tileCamera;
  tileCamera = null;
  webFitted = false;
  return stored;
}

export function markWebFitted() {
  webFitted = true;
}

export function isWebFitted(): boolean {
  return webFitted;
}

export function clearWordWebCamera() {
  tileCamera = null;
  webFitted = false;
}
