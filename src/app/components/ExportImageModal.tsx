/**
 * Hamburger Export image: Compare, Before, or After as a vector SVG or a PNG,
 * drawn in the current orientation and theme. Name is the project name (it sets
 * the file name). The preview is the exported file. Save… asks where to put it.
 * The exporter loads on first open so its embedded font stays out of the main bundle.
 */
import { useEffect, useState } from "react";
import { Button, Group, Modal, SegmentedControl, Stack, Text, TextInput } from "@mantine/core";
import { exportLayoutEngine, layoutEngine } from "../../board/layout/elkClient";
import { chooseSaveTarget, PNG_FILE, SVG_FILE } from "../../state/fileSave";
import { useStore } from "../../state/store";
import { ViewMode } from "../../workflow/catalogs";
import type { WorkflowDoc } from "../../workflow/types";
import type { BoardImage } from "../../export/exportImage";
import { imageFilename, type ImageFormat, type ImageView } from "../../export/imageFiles";
import "./ExportImageModal.css";

const VIEW_OPTIONS: { value: ImageView; label: string }[] = [
  { value: "compare", label: "Compare" },
  { value: "before", label: "Before" },
  { value: "after", label: "After" },
];

const FORMAT_OPTIONS: { value: ImageFormat; label: string }[] = [
  { value: "svg", label: "SVG" },
  { value: "png", label: "PNG" },
];

const PNG_SCALE = 2;

const loadExporter = () => import("../../export/exportImage");

function viewFor(mode: ViewMode): ImageView {
  if (mode === ViewMode.Both) return "compare";
  return mode === ViewMode.After ? "after" : "before";
}

async function drawBoard(doc: WorkflowDoc, view: ImageView): Promise<BoardImage> {
  const mod = await loadExporter();
  return mod.renderBoardImage(doc, view, {
    appearance: useStore.getState().fileAppearance(),
    engine: exportLayoutEngine,
    cache: layoutEngine,
  });
}

type Preview = { image: BoardImage; url: string };

export function ExportImageModal() {
  const opened = useStore((s) => s.exportImageOpen);
  const naming = useStore((s) => s.saveNamePrompt !== null);
  const name = useStore((s) => s.workflow.name ?? "");
  /* Everything the image draws, but not the name: typing a name must not redraw the preview. */
  const nodes = useStore((s) => s.workflow.nodes);
  const edges = useStore((s) => s.workflow.edges);
  const actors = useStore((s) => s.workflow.actors);
  const assignments = useStore((s) => s.workflow.assignments);
  const looks = useStore((s) => s.workflow.looks);
  const after = useStore((s) => s.workflow.after);
  const orientation = useStore((s) => s.boardOrientation);
  const themeId = useStore((s) => s.themes.selected);
  const [view, setView] = useState<ImageView>("compare");
  const [format, setFormat] = useState<ImageFormat>("svg");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (opened) setView(viewFor(useStore.getState().view));
  }, [opened]);

  useEffect(() => {
    if (!opened) {
      setPreview(null);
      return;
    }
    let live = true;
    let url: string | null = null;
    setError(null);
    drawBoard(useStore.getState().workflow, view)
      .then((image) => {
        if (!live) return;
        url = URL.createObjectURL(new Blob([image.svg], { type: "image/svg+xml" }));
        setPreview({ image, url });
      })
      .catch(() => {
        if (live) setError("This board could not be drawn.");
      });
    return () => {
      live = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [opened, nodes, edges, actors, assignments, looks, after, view, orientation, themeId]);

  const close = () => useStore.getState().closeExportImage();
  const filename = imageFilename({ name }, view, format);

  const save = async () => {
    if (!preview) return;
    const kind = format === "svg" ? SVG_FILE : PNG_FILE;
    const target = await chooseSaveTarget(kind, filename, useStore.getState().askSaveName);
    if (!target) return;
    setSaving(true);
    setError(null);
    try {
      const image = await drawBoard(useStore.getState().workflow, view);
      const blob =
        format === "svg"
          ? new Blob([image.svg], { type: SVG_FILE.mime })
          : await (await loadExporter()).svgToPng(image, PNG_SCALE);
      await target.write(blob);
      close();
    } catch {
      setError("The image could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={close}
      title="Export image"
      centered
      size="xl"
      closeOnEscape={!naming}
      closeOnClickOutside={!naming}
    >
      <Stack gap="md">
        <TextInput
          label="Name"
          placeholder="Untitled"
          value={name}
          onChange={(e) => useStore.getState().renameProject(e.currentTarget.value)}
          spellCheck={false}
          autoComplete="off"
        />
        <Group justify="space-between" wrap="nowrap">
          <SegmentedControl
            aria-label="View"
            value={view}
            onChange={(v) => setView(v as ImageView)}
            data={VIEW_OPTIONS}
          />
          <SegmentedControl
            aria-label="Format"
            value={format}
            onChange={(v) => setFormat(v as ImageFormat)}
            data={FORMAT_OPTIONS}
          />
        </Group>
        <div className="export-image-preview" data-ready={preview ? "true" : "false"}>
          {preview ? (
            <img src={preview.url} alt={`${VIEW_OPTIONS.find((o) => o.value === view)?.label} preview`} />
          ) : (
            <Text size="sm" c="dimmed">
              {error ?? "Drawing…"}
            </Text>
          )}
        </div>
        {error && preview ? (
          <Text size="sm" c="red">
            {error}
          </Text>
        ) : null}
        <Group justify="space-between" wrap="nowrap">
          <Text size="sm" c="dimmed" className="export-image-name">
            {filename}
          </Text>
          <Group gap="sm" wrap="nowrap">
            <Button variant="default" onClick={close}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={!preview} loading={saving}>
              Save…
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
