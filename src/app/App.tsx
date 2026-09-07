/**
 * App shell: header Toolbar, right DetailsPanel + score, center Board.
 * Present mode hides the right rail. Theme is dataset.theme for CSS plus Mantine forceColorScheme.
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
import { ReplaceDocumentModal } from "./components/ReplaceDocumentModal";
import { Toolbar } from "./components/Toolbar";
import { DetailsPanel } from "./inspector/SelectedItemForm";

const theme = createTheme({
  fontFamily: "Nunito, system-ui, sans-serif",
  headings: { fontFamily: "Nunito, system-ui, sans-serif" },
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
        zIndex: 5,
        fontWeight: 800,
        fontSize: 13,
        letterSpacing: 0.4,
        background: "var(--cream)",
        color: "var(--ink)",
        border: "1.5px solid var(--line)",
        borderRadius: 999,
        padding: "2px 10px",
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
            borderBottom: "2px solid var(--chrome-line)",
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

  useEffect(() => {
    document.documentElement.dataset.theme = colorScheme;
  }, [colorScheme]);

  return (
    <MantineProvider theme={theme} forceColorScheme={colorScheme}>
      <AppShell
        header={{ height: 56 }}
        aside={{ width: present ? 0 : 268, breakpoint: "xs" }}
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
            style={{ borderLeft: "2px solid var(--chrome-line)" }}
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
          </div>
        </AppShell.Main>
      </AppShell>
      <KeybindsModal />
      <ReplaceDocumentModal />
      <RecoveryModal />
      <ImportErrorModal />
    </MantineProvider>
  );
}
