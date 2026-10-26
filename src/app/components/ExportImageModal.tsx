/**
 * Hamburger Export image: Compare, Before, or After as a vector SVG or a PNG,
 * drawn in the current orientation and theme. The preview is the exported file.
 * The exporter loads on first open so its embedded font stays out of the main bundle.
 */
import { useEffect, useState } from "react";
import { Button, Group, Modal, SegmentedControl, Stack, Text } from "@mantine/core";
import { exportLayoutEngine, layoutEngine } from "../../board/layout/elkClient";
import { downloadBlob } from "../../state/persistence";
import { useStore } from "../../state/store";
import { ViewMode } from "../../workflow/catalogs";
import type { BoardImage, ImageFormat, ImageView } from "../../export/exportImage";
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

type Preview = { image: BoardImage; url: string; filename: (format: ImageFormat) => string };

export function ExportImageModal() {
  const opened = useStore((s) => s.exportImageOpen);
  const workflow = useStore((s) => s.workflow);
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
    void loadExporter()
      .then(async (mod) => {
        const image = await mod.renderBoardImage(workflow, view, {
          appearance: useStore.getState().fileAppearance(),
          engine: exportLayoutEngine,
          cache: layoutEngine,
        });
        if (!live) return;
        url = URL.createObjectURL(new Blob([image.svg], { type: "image/svg+xml" }));
        setPreview({ image, url, filename: (f) => mod.imageFilename(workflow, view, f) });
      })
      .catch(() => {
        if (live) setError("This board could not be drawn.");
      });
    return () => {
      live = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [opened, workflow, view, orientation, themeId]);

  const close = () => useStore.getState().closeExportImage();
  const filename = preview?.filename(format) ?? "";

  const download = async () => {
    if (!preview) return;
    setSaving(true);
    try {
      if (format === "svg") {
        downloadBlob(filename, new Blob([preview.image.svg], { type: "image/svg+xml" }));
      } else {
        const mod = await loadExporter();
        downloadBlob(filename, await mod.svgToPng(preview.image, PNG_SCALE));
      }
      close();
    } catch {
      setError("The PNG could not be made.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal opened={opened} onClose={close} title="Export image" centered size="xl">
      <Stack gap="md">
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
            <Button onClick={() => void download()} disabled={!preview} loading={saving}>
              Download
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
