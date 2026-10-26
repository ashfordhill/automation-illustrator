/**
 * render.html: headless rendering for the render Action and other tools.
 * `window.illustratorRender(text, request)` turns one workflow file into SVG
 * and, on request, PNG images. `data-render-ready` on <html> marks the API live.
 */
import "@fontsource-variable/nunito/wght.css";
import { renderIllustratorFile, type RenderRequest, type RenderResult } from "../export/renderFile";

declare global {
  interface Window {
    illustratorRender?: (text: string, request?: RenderRequest) => Promise<RenderResult>;
  }
}

window.illustratorRender = renderIllustratorFile;
document.documentElement.dataset.renderReady = "true";
