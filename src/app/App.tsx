/**
 * App shell: header Toolbar, right DetailsPanel, center Board.
 * Present hides the top bar, status bar, and right rail (P-07). The inspector
 * folds to a thin strip when editing (P-05). Under 1024 CSS px the board is
 * replaced (P-04). Theme is dataset.theme for CSS plus Mantine forceColorScheme.
 */
import { useEffect, useRef } from "react";
import { AppShell, MantineProvider, createTheme } from "@mantine/core";
import { useReducedMotion } from "@mantine/hooks";
import { Board } from "../board/Board";
import { KeybindsModal } from "../keyboard/KeybindsModal";
import { useAppKeys } from "../keyboard/useAppKeys";
import { useStore } from "../state/store";
import { AssignmentLane, ColorScheme, ViewMode } from "../workflow/catalogs";
import { flowProfile } from "../board/flow/flowProfile";
import { CanvasHelper } from "./components/CanvasHelper";
import { EmptyBoardCta } from "./components/EmptyBoardCta";
import { ImportErrorModal } from "./components/ImportErrorModal";
import { RecoveryModal } from "./components/RecoveryModal";
import { RemovePickerHud } from "./components/RemovePickerHud";
import { ReplaceDocumentModal } from "./components/ReplaceDocumentModal";
import { PresentExpandButton } from "./components/PresentExpandButton";
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

function LanePane({
  lane,
  present,
}: {
  lane: typeof AssignmentLane.Before | typeof AssignmentLane.After;
  present: boolean;
}) {
  const paneRef = useRef<HTMLDivElement>(null);
  const presentExpand = useStore((s) => s.presentExpand);
  const tucked = present && presentExpand !== null && presentExpand !== lane;
  const expanded = present && presentExpand === lane;
  const isAfter = lane === AssignmentLane.After;
  useEffect(() => {
    if (!tucked) return;
    const root = paneRef.current;
    const ae = document.activeElement;
    if (root && ae instanceof HTMLElement && root.contains(ae)) ae.blur();
  }, [tucked]);
  return (
    <div
      ref={paneRef}
      className={[
        "lane-pane",
        isAfter ? "lane-after" : "lane-before",
        tucked ? "is-tucked" : undefined,
        expanded ? "is-expanded" : undefined,
      ]
        .filter(Boolean)
        .join(" ")}
      data-present-pane={present ? lane : undefined}
      data-tucked={present ? (tucked ? "true" : "false") : undefined}
      inert={tucked ? true : undefined}
      aria-hidden={tucked || undefined}
    >
      {present ? <PresentExpandButton lane={lane} /> : null}
      <Board lane={lane} />
    </div>
  );
}

/** One Board, or stacked Before/After for Compare and for Present (P-07). */
function CanvasArea() {
  const view = useStore((s) => s.view);
  const present = useStore((s) => s.present);
  const presentExpand = useStore((s) => s.presentExpand);
  const orientation = useStore((s) => s.boardOrientation);
  const profile = flowProfile(orientation);
  if (present || view === ViewMode.Both) {
    return (
      <div
        className="lane-stack"
        data-present-expand={present ? (presentExpand ?? "split") : undefined}
        data-orientation={orientation}
        data-stack={profile.stack}
      >
        <LanePane lane={AssignmentLane.Before} present={present} />
        <LanePane lane={AssignmentLane.After} present={present} />
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

  useEffect(() => {
    const onTheme = (e: Event) => {
      const next = (e as CustomEvent<string>).detail;
      if (next === ColorScheme.Dark || next === ColorScheme.Light) {
        useStore.getState().setColorScheme(next);
      }
    };
    window.addEventListener("automation-pitch-theme", onTheme);
    return () => window.removeEventListener("automation-pitch-theme", onTheme);
  }, []);

  return (
    <MantineProvider theme={theme} forceColorScheme={colorScheme}>
      {supported ? (
        <AppShell
        header={present ? undefined : { height: 56 }}
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
        {!present && (
          <AppShell.Header className="chrome-bar">
            <Toolbar />
          </AppShell.Header>
        )}
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
      {supported && !present ? <StatusBar /> : null}
      <KeybindsModal />
      <ReplaceDocumentModal />
      <RecoveryModal />
      <ImportErrorModal />
    </MantineProvider>
  );
}
