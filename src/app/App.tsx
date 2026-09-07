/**
 * App shell: header Toolbar, right DetailsPanel + score, center Board.
 * Present mode hides the right rail. Under 1024 CSS px the board is replaced (P-04).
 * Theme is dataset.theme for CSS plus Mantine forceColorScheme.
 */
import { useEffect } from "react";
import { AppShell, MantineProvider, createTheme } from "@mantine/core";
import { Board } from "../board/Board";
import { KeybindsModal } from "../keyboard/KeybindsModal";
import { useAppKeys } from "../keyboard/useAppKeys";
import { useStore } from "../state/store";
import { AssignmentLane, ViewMode } from "../workflow/catalogs";
import { automationScore } from "../workflow/scoring";
import { CanvasHelper } from "./components/CanvasHelper";
import { EmptyBoardCta } from "./components/EmptyBoardCta";
import { ImportErrorModal } from "./components/ImportErrorModal";
import { RecoveryModal } from "./components/RecoveryModal";
import { RemovePickerHud } from "./components/RemovePickerHud";
import { ReplaceDocumentModal } from "./components/ReplaceDocumentModal";
import { MergeDock } from "./components/MergeDock";
import { Toolbar } from "./components/Toolbar";
import { TransientNotice } from "./components/TransientNotice";
import { UnsupportedViewport } from "./components/UnsupportedViewport";
import { DetailsPanel } from "./inspector/SelectedItemForm";
import { useSupportedViewport } from "./viewport";

const theme = createTheme({
  fontFamily: '"Nunito Variable", Nunito, system-ui, sans-serif',
  headings: { fontFamily: '"Nunito Variable", Nunito, system-ui, sans-serif' },
  defaultRadius: "md",
  primaryColor: "cyan",
  cursorType: "pointer",
});

/** Corner chip on a Board so Both view can label BEFORE vs AFTER. */
function LaneLabel({ text }: { text: string }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 10,
        left: 14,
        pointerEvents: "none",
        fontWeight: 800,
        fontSize: 13,
        letterSpacing: 0.6,
        background: "var(--cream)",
        color: "var(--ink)",
        border: "3px solid var(--line)",
        borderRadius: 999,
        padding: "3px 12px",
        boxShadow: "var(--chip-shadow)",
      }}
    >
      {text}
    </div>
  );
}

/** One Board, or stacked Before/After when view is Both. */
function CanvasArea() {
  const view = useStore((s) => s.view);
  if (view === ViewMode.Both) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            position: "relative",
            borderBottom: "3px solid var(--chrome-line)",
          }}
        >
          <LaneLabel text="BEFORE" />
          <Board lane={AssignmentLane.Before} />
        </div>
        <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
          <LaneLabel text="AFTER" />
          <Board lane={AssignmentLane.After} />
        </div>
      </div>
    );
  }
  return (
    <div style={{ height: "100%", position: "relative" }}>
      <LaneLabel text={view.toUpperCase()} />
      <Board
        lane={view === ViewMode.After ? AssignmentLane.After : AssignmentLane.Before}
      />
    </div>
  );
}

function ScoreFooter() {
  const workflow = useStore((s) => s.workflow);
  return <div className="details-score">{automationScore(workflow)}</div>;
}

export default function App() {
  useAppKeys();
  const present = useStore((s) => s.present);
  const colorScheme = useStore((s) => s.colorScheme);
  const supported = useSupportedViewport();

  useEffect(() => {
    document.documentElement.dataset.theme = colorScheme;
  }, [colorScheme]);

  return (
    <MantineProvider theme={theme} forceColorScheme={colorScheme}>
      {supported ? (
        <AppShell
        header={{ height: 56 }}
        aside={{ width: present ? 0 : 320, breakpoint: "xs" }}
        padding={0}
        className={present ? "present-mode" : undefined}
        styles={{
          main: {
            background: "var(--paper)",
            height: "100dvh",
            display: "flex",
            flexDirection: "column",
          },
          aside: {
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            height: "calc(100dvh - 56px)",
            minHeight: 0,
          },
        }}
      >
        <AppShell.Header className="chrome-bar">
          <Toolbar />
        </AppShell.Header>
        {!present && (
          <AppShell.Aside
            p={0}
            className="chrome-bar"
            style={{ borderLeft: "3px solid var(--chrome-line)" }}
          >
            <div className="details-rail">
              <div className="details-rail-body">
                <DetailsPanel />
              </div>
              <ScoreFooter />
            </div>
          </AppShell.Aside>
        )}
        <AppShell.Main
          style={{
            paddingLeft: 0,
            paddingBottom: 0,
          }}
        >
          <div style={{ height: "100%", position: "relative" }}>
            <CanvasArea />
            <EmptyBoardCta />
            <CanvasHelper />
            <TransientNotice />
            <RemovePickerHud />
            <MergeDock />
          </div>
        </AppShell.Main>
      </AppShell>
      ) : (
        <UnsupportedViewport />
      )}
      <KeybindsModal />
      <ReplaceDocumentModal />
      <RecoveryModal />
      <ImportErrorModal />
    </MantineProvider>
  );
}
