/**
 * Save a file where the user chooses. Chromium's save dialog (File System Access,
 * secure pages only: https or localhost) names the file, picks the folder, and
 * remembers the folder per kind of file. Other browsers, and the app served over
 * plain HTTP from another machine, ask for a name in the app and download it.
 *
 * Ask first, write after: the dialog must open while the click that asked for it
 * is still being handled, so callers build the bytes once a target exists.
 */
import { ILLUSTRATOR_FILE_EXTENSION, ILLUSTRATOR_FILE_MIME } from "../workflow/serialize";
import { downloadBlob } from "./persistence";

export type FileKind = {
  description: string;
  mime: string;
  extension: string;
  /** Chromium reopens the dialog in the last folder used for this id. */
  pickerId: string;
};

export const WORKFLOW_FILE: FileKind = {
  description: "Automation Illustrator workflow",
  mime: ILLUSTRATOR_FILE_MIME,
  extension: ILLUSTRATOR_FILE_EXTENSION,
  pickerId: "illustrator-workflows",
};

export const SVG_FILE: FileKind = {
  description: "SVG image",
  mime: "image/svg+xml",
  extension: ".svg",
  pickerId: "illustrator-images",
};

export const PNG_FILE: FileKind = {
  description: "PNG image",
  mime: "image/png",
  extension: ".png",
  pickerId: "illustrator-images",
};

export type SaveTarget = { name: string; write(blob: Blob): Promise<void> };

export type FileNameRequest = { suggestedName: string; extension: string };

/** The in-app name prompt. Null means Cancel. */
export type AskFileName = (request: FileNameRequest) => Promise<string | null>;

type Writable = { write(data: Blob): Promise<void>; close(): Promise<void> };
type SaveHandle = { name: string; createWritable(): Promise<Writable> };
type SavePicker = (options: {
  suggestedName: string;
  id: string;
  startIn: string;
  excludeAcceptAllOption: boolean;
  types: { description: string; accept: Record<string, string[]> }[];
}) => Promise<SaveHandle>;

function savePicker(): SavePicker | null {
  if (typeof window === "undefined") return null;
  const picker = (window as unknown as { showSaveFilePicker?: SavePicker }).showSaveFilePicker;
  return typeof picker === "function" ? picker.bind(window) : null;
}

/** "flow" → flow.illustrator; a name that already ends in the extension stays. */
export function withExtension(name: string, extension: string): string {
  return name.toLowerCase().endsWith(extension.toLowerCase()) ? name : `${name}${extension}`;
}

export function withoutExtension(name: string, extension: string): string {
  return name.toLowerCase().endsWith(extension.toLowerCase())
    ? name.slice(0, -extension.length)
    : name;
}

function isAbort(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { name?: unknown }).name === "AbortError";
}

/** Where to write, or null when the user cancels. */
export async function chooseSaveTarget(
  kind: FileKind,
  suggestedName: string,
  askName: AskFileName,
): Promise<SaveTarget | null> {
  const picker = savePicker();
  if (picker) {
    try {
      const handle = await picker({
        suggestedName,
        id: kind.pickerId,
        startIn: "documents",
        excludeAcceptAllOption: true,
        types: [{ description: kind.description, accept: { [kind.mime]: [kind.extension] } }],
      });
      return {
        name: handle.name,
        async write(blob) {
          const out = await handle.createWritable();
          await out.write(blob);
          await out.close();
        },
      };
    } catch (error) {
      if (isAbort(error)) return null;
      /* The page lost the click (SecurityError) or the dialog is blocked: name it in the app instead. */
    }
  }
  const typed = await askName({ suggestedName, extension: kind.extension });
  const trimmed = typed?.trim();
  if (!trimmed) return null;
  const name = withExtension(trimmed, kind.extension);
  return {
    name,
    async write(blob) {
      downloadBlob(name, blob);
    },
  };
}
