/**
 * Test stand-in for Chromium's save dialog (`showSaveFilePicker`) under jsdom.
 * Each call takes the next queued answer: a typed file name, null for Cancel,
 * or nothing to accept the suggested name. Written files are kept in `saved`.
 */
export type SavedFile = { name: string; suggestedName: string; blob: Blob };

export type FakeSaveDialog = {
  saved: SavedFile[];
  /** Suggested names the app passed, one per dialog shown. */
  suggestions: string[];
  /** Queue the answer to the next dialog. */
  answer: (name: string | null) => void;
  uninstall: () => void;
};

type PickerWindow = { showSaveFilePicker?: unknown };

export function installFakeSaveDialog(): FakeSaveDialog {
  const saved: SavedFile[] = [];
  const suggestions: string[] = [];
  const answers: (string | null)[] = [];
  (window as unknown as PickerWindow).showSaveFilePicker = async (options: { suggestedName: string }) => {
    suggestions.push(options.suggestedName);
    const answer = answers.length ? answers.shift() : undefined;
    if (answer === null) throw new DOMException("The user aborted a request.", "AbortError");
    const name = answer ?? options.suggestedName;
    return {
      name,
      createWritable: async () => {
        const parts: Blob[] = [];
        return {
          write: async (blob: Blob) => {
            parts.push(blob);
          },
          close: async () => {
            saved.push({ name, suggestedName: options.suggestedName, blob: new Blob(parts) });
          },
        };
      },
    };
  };
  return {
    saved,
    suggestions,
    answer: (name) => answers.push(name),
    uninstall: () => {
      delete (window as unknown as PickerWindow).showSaveFilePicker;
    },
  };
}
