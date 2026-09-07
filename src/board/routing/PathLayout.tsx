/**
 * Share routed polylines so condition chips can be placed as one stage (CX-04).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { measureLabelBox, type LabelBox } from "../layout/labelBox";
import { placeAllConditions, type LabelPlacement } from "./placeLabels";
import { polylineKey, type NodeRect, type PolyPoint } from "./polyline";

type PathLayoutValue = {
  reportPath: (id: string, points: PolyPoint[]) => void;
  placements: Record<string, LabelPlacement>;
  labelsReady: boolean;
};

const PathLayoutContext = createContext<PathLayoutValue>({
  reportPath: () => {},
  placements: {},
  labelsReady: true,
});

export function PathLayoutProvider({
  edgeIds,
  labels,
  nodeRects,
  onLabelRects,
  children,
}: {
  edgeIds: string[];
  labels: Record<string, string>;
  nodeRects: NodeRect[];
  onLabelRects?: (rects: LabelPlacement[]) => void;
  children: ReactNode;
}) {
  const [paths, setPaths] = useState<Record<string, PolyPoint[]>>({});

  const reportPath = useCallback((id: string, points: PolyPoint[]) => {
    const key = polylineKey(points);
    setPaths((prev) => {
      const cur = prev[id];
      if (cur && polylineKey(cur) === key) return prev;
      return { ...prev, [id]: points };
    });
  }, []);

  const boxes = useMemo(() => {
    const next: Record<string, LabelBox> = {};
    for (const id of edgeIds) {
      const text = labels[id] ?? "";
      if (text.trim()) next[id] = measureLabelBox(text);
    }
    return next;
  }, [edgeIds, labels]);

  const labeledIds = useMemo(
    () => edgeIds.filter((id) => (labels[id] ?? "").trim()).sort(),
    [edgeIds, labels],
  );

  const placements = useMemo(
    () => placeAllConditions(paths, boxes, nodeRects, labeledIds),
    [paths, boxes, nodeRects, labeledIds],
  );

  const labelsReady =
    labeledIds.length === 0 || labeledIds.every((id) => Boolean(placements[id]));

  useEffect(() => {
    onLabelRects?.(Object.values(placements));
  }, [placements, onLabelRects]);

  const value = useMemo(
    () => ({ reportPath, placements, labelsReady }),
    [reportPath, placements, labelsReady],
  );

  return (
    <PathLayoutContext.Provider value={value}>
      <div className="path-layout-host" data-labels-ready={labelsReady ? "true" : "false"}>
        {children}
      </div>
    </PathLayoutContext.Provider>
  );
}

export function usePathLayout(): PathLayoutValue {
  return useContext(PathLayoutContext);
}
