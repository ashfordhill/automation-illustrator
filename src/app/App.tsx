/**
 * App shell: header Toolbar, right DetailsPanel, center Board.
 * Present mode hides the right rail. The inspector folds to a thin strip (P-05).
 * A thin status bar overlaps the inspector (P-05 amendment).
 * Under 1024 CSS px the board is replaced (P-04).
 * Theme is dataset.theme for CSS plus Mantine forceColorScheme.
 */
import { useEffect } from "react";
import { AppShell, MantineProvider, createTheme } from "@mantine/core";
import { useReducedMotion } from "@mantine/hooks";
import { Board } from "../board/Board";
import { KeybindsModal } from "../keyboard/KeybindsModal";
import { useAppKeys } from "../keyboard/useAppKeys";
import { useStore } from "../state/store";
import { AssignmentLane, ViewMode } from "../workflow/catalogs";
import { CanvasHelper } from "./components/CanvasHelper";
import { EmptyBoardCta } from "./components/EmptyBoardCta";
import { ImportErrorModal } from "./components/ImportErrorModal";
import { RecoveryModal } from "./components/RecoveryModal";
import { RemovePickerHud } from "./components/RemovePickerHud";
import { ReplaceDocumentModal } from "./components/ReplaceDocumentModal";
import { StatusBar } from "./components/StatusBar";
import { Toolbar } from "./components/Toolbar";
import { TransientNotice } from "./components/TransientNotice";
import { PathContextMenu } from "../board/controls/PathContextMenu";
import { UnsupportedViewport } from "./components/UnsupportedViewport";
import { InspectorFold, INSPECTOR_OPEN_WIDTH, INSPECTOR_STRIP_WIDTH } from "./inspector/InspectorFold";
import { DetailsPanel } from "./inspector/SelectedItemForm";
import { useSupportedViewport } from "./viewport";

const FONT_FAMILY = '"Nunito Variable", Nunito, system-ui, sans-serif';

const theme = createTheme({
  fontFamily: FONT_FAMILY,
  headings: { fontFamily: FONT_FAMILY },
  defaultRadius: "md",
  primaryColor: "cyan",
  cursorType: "pointer",
  components: {
    Button: {
      styles: {
        root: { fontFamily: FONT_FAMILY },
        label: { fontFamily: FONT_FAMILY },
      },
    },
  },
});

/** One Board, or stacked Before/After when view is Both. View name lives only on the switch (SH-02). */
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
          <Board lane={AssignmentLane.Before} />
        </div>
        <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
          <Board lane={AssignmentLane.After} />
        </div>
      </div>
    );
  }
  return (
    <div style={{ height: "100%", position: "relative" }}>
      <Board
        lane={view === ViewMode.After ? AssignmentLane.After : AssignmentLane.Before}
      />
    </div>
  );
}

export default function App() {
  useAppKeys();
  const present = useStore((s) => s.present);
  const inspectorCollapsed = useStore((s) => s.inspectorCollapsed);
  const colorScheme = useStore((s) => s.colorScheme);
  const supported = useSupportedViewport();
  const reduceMotion = useReducedMotion();
  const asideWidth = present
    ? 0
    : inspectorCollapsed
      ? INSPECTOR_STRIP_WIDTH
      : INSPECTOR_OPEN_WIDTH;

  useEffect(() => {
    document.documentElement.dataset.theme = colorScheme;
  }, [colorScheme]);

  return (
    <MantineProvider theme={theme} forceColorScheme={colorScheme}>
      {supported ? (
        <AppShell
        header={{ height: 56 }}
        aside={{ width: asideWidth, breakpoint: "xs" }}
        padding={0}
        transitionDuration={reduceMotion ? 0 : 200}
        className={["app-shell-fold", present ? "present-mode" : undefined]
          .filter(Boolean)
          .join(" ")}
        data-inspector-collapsed={inspectorCollapsed ? "true" : "false"}
        styles={{
          root: {
            "--app-shell-aside-width": `${asideWidth}px`,
            "--app-shell-aside-offset": `${asideWidth}px`,
          },
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
            width: asideWidth,
            minWidth: asideWidth,
            maxWidth: asideWidth,
            zIndex: 80,
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
            <div
              className={`details-rail${inspectorCollapsed ? " is-collapsed" : ""}`}
              data-inspector={inspectorCollapsed ? "collapsed" : "open"}
            >
              <InspectorFold />
              <div
                id="details-rail-body"
                className="details-rail-body"
                inert={inspectorCollapsed ? true : undefined}
                aria-hidden={inspectorCollapsed}
              >
                <DetailsPanel />
              </div>
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
            <PathContextMenu />
            <RemovePickerHud />
          </div>
        </AppShell.Main>
      </AppShell>
      ) : (
        <UnsupportedViewport />
      )}
      {supported ? <StatusBar /> : null}
      <KeybindsModal />
      <ReplaceDocumentModal />
      <RecoveryModal />
      <ImportErrorModal />
    </MantineProvider>
  );
}
