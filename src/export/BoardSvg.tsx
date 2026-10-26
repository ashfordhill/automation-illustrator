/**
 * Static SVG of one lane for image export, in board coordinates at zoom 1.
 * Draws what StepTile, ActorColumn, DataTile, and FlowArrow show and never the
 * selection or editing chrome. Colors stay `var(--name)` until exportImage.ts
 * resolves them. Geometry follows the tile CSS in app/styles/tokens.css.
 */
import { ActorKind, type AccessoryKind, type AssignmentLane } from "../workflow/catalogs";
import { FIGURE_INK_ON_PASTEL } from "../workflow/actors";
import { edgeIsDotted } from "../workflow/graph";
import { accessoriesFor } from "../workflow/looks";
import {
  DEFAULT_HUMAN_ROLE,
  isHuman,
  isRobot,
  isStepNode,
  laneAssignments,
  laneBoard,
  robotRole,
  stepDisplayLabel,
  type ActorDto,
  type StepKind,
  type WorkflowDoc,
} from "../workflow/types";
import type { LaneProjection } from "../state/projection";
import type { LaneLayout, Rect } from "../board/layout/laneLayout";
import { LABEL_FONT_PX, LABEL_LINE_HEIGHT, wrapConditionLines } from "../board/layout/labelBox";
import {
  ACTOR_W,
  FIELD_H,
  FIELD_RX,
  FIELD_W,
  STEP_H,
  STEP_RX,
  STEP_W,
} from "../board/layout/tileMetrics";
import {
  DOTTED_DASH,
  DOTTED_GAP,
  DOTTED_PERIOD,
  polylineDrawSegments,
  polylineToSvg,
  type PolyPoint,
} from "../board/routing/polyline";
import { DataChip } from "../board/tiles/DataChip";
import { MIN_TILE_FONT_PX } from "../board/tiles/FitLabel";
import { HumanFigure } from "../board/tiles/HumanFigure";
import { RobotFigure } from "../board/tiles/RobotFigure";
import { StepKindIcon } from "../board/tiles/StepKindIcon";
import { ACTOR_CARD_BORDER, BOARD_TOKENS, CHIP_SHADOW, TILE_SHADOW } from "./boardTokens";
import { roleChipFill } from "./color";
import { baselineY, blockHeight, fitOneLine, textWidth, wrapText, type FittedText } from "./textFit";

const BORDER = 3;
const PATH_STROKE = 2.75;
const CHIP_RX = 10;

const STRIP_PAD_TOP = 10;
const STRIP_PAD_X = 8;
const STRIP_PAD_BOTTOM = 8;
const FIGURE_SIZE = 36;
const FIGURE_H = FIGURE_SIZE * 1.55;
const CARD_PAD = 3;
/** `.actor-card` asks for 1.5px; Chrome draws 1px at device pixel ratio 1 and wraps names against that. */
const CARD_BORDER = 1;
const CARD_RX = 8;
const ROLE_PAD_X = 8;
const ROLE_PAD_Y = 6;
const ROLE_RX = 6;

const TASK_PAD_TOP = 24;
const TASK_PAD_X = 10;
const TASK_PAD_BOTTOM = 8;
const TASK_GAP = 2;
const ICON_SIZE = 52;
const TITLE_PAD_TOP = 4;
const TITLE_PAD_X = 2;
const TITLE_MAX_H = 58;
const DETAIL_BASIS = 36;
const DETAIL_MIN_H = 20;
const DETAIL_PAD_TOP = 4;
const TILE_LINE_HEIGHT = 1.15;

const FIELD_PAD_X = 10;
const FIELD_PAD_Y = 8;
const FIELD_GAP = 6;
const DATA_CHIP_SIZE = 28;

const CAPTION_FONT_PX = 14;
const CAPTION_PAD_X = 12;
export const CAPTION_H = 34;

function r(n: number): number {
  return Math.round(n * 100) / 100;
}

function TextLines({
  fitted,
  cx,
  top,
  fill,
}: {
  fitted: FittedText;
  cx: number;
  top: number;
  fill: string;
}) {
  return (
    <>
      {fitted.lines.map((line, i) => (
        <text
          key={i}
          x={r(cx)}
          y={r(baselineY(top, i, fitted.size, fitted.lineHeight))}
          textAnchor="middle"
          fontSize={fitted.size}
          fontWeight={800}
          fill={fill}
        >
          {line}
        </text>
      ))}
    </>
  );
}

/** A CSS `border` drawn inside the box: the stroke centerline sits half a border in. */
function InsetBorder({
  x,
  y,
  w,
  h,
  rx,
  width,
  stroke,
  strokeOpacity,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  rx: number;
  width: number;
  stroke: string;
  strokeOpacity?: number;
}) {
  const half = width / 2;
  return (
    <rect
      x={r(x + half)}
      y={r(y + half)}
      width={r(w - width)}
      height={r(h - width)}
      rx={r(Math.max(0, rx - half))}
      fill="none"
      stroke={stroke}
      strokeWidth={width}
      strokeOpacity={strokeOpacity}
    />
  );
}

function TileShadow({ w, h, rx }: { w: number; h: number; rx: number }) {
  return (
    <rect
      y={TILE_SHADOW.dy}
      width={w}
      height={h}
      rx={rx}
      fill={TILE_SHADOW.color}
      fillOpacity={TILE_SHADOW.opacity}
    />
  );
}

function ActorStrip({
  actor,
  accessories,
}: {
  actor: ActorDto | undefined;
  accessories: readonly AccessoryKind[];
}) {
  const fill = actor?.color ?? "var(--actor-empty)";
  const human = actor?.kind !== ActorKind.Robot;
  const role = isHuman(actor)
    ? (actor.role ?? "").trim() || DEFAULT_HUMAN_ROLE
    : isRobot(actor)
      ? robotRole(actor)
      : "";
  const left = BORDER + STRIP_PAD_X;
  const width = ACTOR_W - BORDER - STRIP_PAD_X * 2;
  const top = BORDER + STRIP_PAD_TOP;
  const bottom = STEP_H - BORDER - STRIP_PAD_BOTTOM;
  const inner = width - (CARD_BORDER + CARD_PAD) * 2;
  const cx = left + width / 2;

  const name = fitOneLine(actor?.name ?? "—", {
    width: inner - 2,
    maxLines: 2,
    maxFont: 16,
    minFont: MIN_TILE_FONT_PX,
    lineHeight: 1,
  });
  const roleText = role
    ? wrapText(role, { width: inner - ROLE_PAD_X * 2, size: MIN_TILE_FONT_PX, maxLines: 3, lineHeight: 1 })
    : null;
  const nameH = blockHeight(name);
  const roleH = roleText ? ROLE_PAD_Y * 2 + blockHeight(roleText) : 0;
  const cardH = (CARD_BORDER + CARD_PAD) * 2 + nameH + roleH;
  const cardY = bottom - cardH;
  const nameTop = cardY + CARD_BORDER + CARD_PAD;
  const roleTop = nameTop + nameH;
  const figureTop = top + (cardY - top - FIGURE_H) / 2;

  return (
    <>
      <rect x={BORDER} y={BORDER} width={ACTOR_W} height={STEP_H - BORDER * 2} fill={fill} />
      <rect x={ACTOR_W} y={BORDER} width={BORDER} height={STEP_H - BORDER * 2} fill="var(--line)" />
      <g transform={`translate(${r(cx - FIGURE_SIZE / 2)} ${r(figureTop)})`}>
        {human ? (
          <HumanFigure size={FIGURE_SIZE} color={FIGURE_INK_ON_PASTEL} accessories={accessories} />
        ) : (
          <RobotFigure size={FIGURE_SIZE} color={FIGURE_INK_ON_PASTEL} />
        )}
      </g>
      <rect x={left} y={r(cardY)} width={width} height={r(cardH)} rx={CARD_RX} fill="var(--cream)" />
      <InsetBorder
        x={left}
        y={cardY}
        w={width}
        h={cardH}
        rx={CARD_RX}
        width={CARD_BORDER}
        stroke={ACTOR_CARD_BORDER.color}
        strokeOpacity={ACTOR_CARD_BORDER.opacity}
      />
      <TextLines fitted={name} cx={cx} top={nameTop} fill="var(--ink)" />
      {roleText ? (
        <>
          <rect
            x={left + CARD_BORDER + CARD_PAD}
            y={r(roleTop)}
            width={inner}
            height={r(roleH)}
            rx={ROLE_RX}
            fill={roleChipFill(actor?.color ?? BOARD_TOKENS["--actor-empty"])}
          />
          <TextLines fitted={roleText} cx={cx} top={roleTop + ROLE_PAD_Y} fill={FIGURE_INK_ON_PASTEL} />
        </>
      ) : null}
    </>
  );
}

function TaskCard({ kind, title, detail }: { kind: StepKind; title: string; detail: string }) {
  const left = ACTOR_W + BORDER + TASK_PAD_X;
  const width = STEP_W - BORDER - TASK_PAD_X - left;
  const cx = left + width / 2;
  const bottom = STEP_H - BORDER - TASK_PAD_BOTTOM;
  const iconTop = BORDER + TASK_PAD_TOP;
  const headline = stepDisplayLabel(kind, title);
  const note = detail.trim();

  let y = iconTop + ICON_SIZE + TASK_GAP;
  const titleTop = y;
  const titleText = headline
    ? wrapText(headline, {
        width: width - TITLE_PAD_X * 2,
        size: MIN_TILE_FONT_PX,
        height: TITLE_MAX_H - BORDER - TITLE_PAD_TOP,
        maxLines: 3,
        lineHeight: TILE_LINE_HEIGHT,
      })
    : null;
  if (titleText) {
    y += Math.min(TITLE_MAX_H, BORDER + TITLE_PAD_TOP + blockHeight(titleText)) + TASK_GAP;
  }
  const detailTop = y;
  const detailH = Math.max(DETAIL_MIN_H, Math.min(DETAIL_BASIS, bottom - detailTop));
  const detailText = note
    ? wrapText(note, {
        width,
        size: MIN_TILE_FONT_PX,
        height: detailH - BORDER - DETAIL_PAD_TOP,
        maxLines: 2,
        lineHeight: TILE_LINE_HEIGHT,
      })
    : null;

  return (
    <>
      <g transform={`translate(${r(cx - ICON_SIZE / 2)} ${iconTop})`}>
        <StepKindIcon kind={kind} size={ICON_SIZE} />
      </g>
      {titleText ? (
        <>
          <rect x={left} y={r(titleTop)} width={width} height={BORDER} fill="var(--line)" />
          <TextLines
            fitted={titleText}
            cx={cx}
            top={titleTop + BORDER + TITLE_PAD_TOP}
            fill="var(--ink)"
          />
        </>
      ) : null}
      {detailText ? (
        <>
          <rect x={left} y={r(detailTop)} width={width} height={BORDER} fill="var(--line)" />
          <TextLines
            fitted={detailText}
            cx={cx}
            top={detailTop + BORDER + DETAIL_PAD_TOP}
            fill="var(--ink)"
          />
        </>
      ) : null}
    </>
  );
}

function StepTileArt({
  clipId,
  actor,
  accessories,
  kind,
  title,
  detail,
}: {
  clipId: string;
  actor: ActorDto | undefined;
  accessories: readonly AccessoryKind[];
  kind: StepKind;
  title: string;
  detail: string;
}) {
  return (
    <>
      <TileShadow w={STEP_W} h={STEP_H} rx={STEP_RX} />
      <rect width={STEP_W} height={STEP_H} rx={STEP_RX} fill="var(--cream)" />
      <clipPath id={clipId}>
        <rect
          x={BORDER}
          y={BORDER}
          width={STEP_W - BORDER * 2}
          height={STEP_H - BORDER * 2}
          rx={STEP_RX - BORDER}
        />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <ActorStrip actor={actor} accessories={accessories} />
        <TaskCard kind={kind} title={title} detail={detail} />
      </g>
      <InsetBorder x={0} y={0} w={STEP_W} h={STEP_H} rx={STEP_RX} width={BORDER} stroke="var(--line)" />
    </>
  );
}

function DataTileArt({ label, color }: { label: string; color?: string }) {
  const text = label.trim() || "Data";
  const left = BORDER + FIELD_PAD_X;
  const width = FIELD_W - left * 2;
  const top = BORDER + FIELD_PAD_Y;
  const height = FIELD_H - top * 2;
  const fitted = wrapText(text, {
    width,
    size: MIN_TILE_FONT_PX,
    height: height - DATA_CHIP_SIZE - FIELD_GAP,
    maxLines: 3,
    lineHeight: TILE_LINE_HEIGHT,
  });
  const total = DATA_CHIP_SIZE + FIELD_GAP + blockHeight(fitted);
  const start = top + (height - total) / 2;
  const cx = FIELD_W / 2;
  return (
    <>
      <TileShadow w={FIELD_W} h={FIELD_H} rx={FIELD_RX} />
      <rect width={FIELD_W} height={FIELD_H} rx={FIELD_RX} fill="var(--cream)" />
      <InsetBorder x={0} y={0} w={FIELD_W} h={FIELD_H} rx={FIELD_RX} width={BORDER} stroke="var(--line)" />
      <g transform={`translate(${r(cx - DATA_CHIP_SIZE / 2)} ${r(start)})`}>
        <DataChip color={color} />
      </g>
      <TextLines fitted={fitted} cx={cx} top={start + DATA_CHIP_SIZE + FIELD_GAP} fill="var(--ink)" />
    </>
  );
}

function ConditionChip({ rect, label }: { rect: Rect; label: string }) {
  const lines = wrapConditionLines(label);
  if (!lines.length) return null;
  const fitted: FittedText = { size: LABEL_FONT_PX, lines, lineHeight: LABEL_LINE_HEIGHT };
  const top = rect.y + (rect.h - blockHeight(fitted)) / 2;
  return (
    <g>
      <rect
        x={rect.x}
        y={rect.y + CHIP_SHADOW.dy}
        width={rect.w}
        height={rect.h}
        rx={CHIP_RX}
        fill={CHIP_SHADOW.color}
        fillOpacity={CHIP_SHADOW.opacity}
      />
      <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} rx={CHIP_RX} fill="var(--cream)" />
      <InsetBorder x={rect.x} y={rect.y} w={rect.w} h={rect.h} rx={CHIP_RX} width={BORDER} stroke="var(--line)" />
      <TextLines fitted={fitted} cx={rect.x + rect.w / 2} top={top} fill="var(--ink)" />
    </g>
  );
}

function PathArt({ points, dotted }: { points: PolyPoint[]; dotted: boolean }) {
  if (points.length < 2) return null;
  if (!dotted) {
    return (
      <path
        d={polylineToSvg(points)}
        fill="none"
        stroke="var(--line)"
        strokeWidth={PATH_STROKE}
        strokeLinecap="butt"
        strokeLinejoin="miter"
      />
    );
  }
  return (
    <g
      fill="none"
      stroke="var(--line)"
      strokeWidth={PATH_STROKE}
      strokeLinecap="butt"
      strokeDasharray={`${DOTTED_DASH} ${DOTTED_GAP}`}
    >
      {polylineDrawSegments(points, DOTTED_PERIOD).map((s, i) => (
        <path key={i} d={`M ${s.x1} ${s.y1} L ${s.x2} ${s.y2}`} strokeDashoffset={s.dashOffset} />
      ))}
    </g>
  );
}

/** Pill naming the lane in the image margin ("Before" / "After"). */
export function LaneCaption({ x, y, text }: { x: number; y: number; text: string }) {
  const w = Math.ceil(textWidth(text, CAPTION_FONT_PX) + CAPTION_PAD_X * 2 + BORDER * 2);
  const fitted: FittedText = { size: CAPTION_FONT_PX, lines: [text], lineHeight: 1.2 };
  return (
    <g transform={`translate(${r(x)} ${r(y)})`}>
      <rect
        y={CHIP_SHADOW.dy}
        width={w}
        height={CAPTION_H}
        rx={CHIP_RX}
        fill={CHIP_SHADOW.color}
        fillOpacity={CHIP_SHADOW.opacity}
      />
      <rect width={w} height={CAPTION_H} rx={CHIP_RX} fill="var(--cream)" />
      <InsetBorder x={0} y={0} w={w} h={CAPTION_H} rx={CHIP_RX} width={BORDER} stroke="var(--line)" />
      <TextLines fitted={fitted} cx={w / 2} top={(CAPTION_H - blockHeight(fitted)) / 2} fill="var(--ink)" />
    </g>
  );
}

/** Every tile, Path, and chip of one lane at its laid-out position. */
export function LaneArt({
  doc,
  lane,
  projection,
  layout,
  idPrefix,
}: {
  doc: WorkflowDoc;
  lane: AssignmentLane;
  projection: LaneProjection;
  layout: LaneLayout;
  idPrefix: string;
}) {
  const board = laneBoard(doc, lane);
  const who = laneAssignments(doc, lane);
  const paths = projection.edges
    .map((e) => {
      const origin = board.edges.find((x) => x.id === e.originId);
      return {
        id: e.id,
        label: e.label,
        points: layout.routes[e.id] ?? [],
        dotted: origin ? edgeIsDotted(board.nodes, board.edges, origin) : false,
      };
    })
    .sort((a, b) => Number(!a.dotted) - Number(!b.dotted));

  return (
    <g>
      {paths.map((p) => (
        <PathArt key={p.id} points={p.points} dotted={p.dotted} />
      ))}
      {paths.map((p) => {
        const rect = layout.labels[p.id];
        return rect && p.label.trim() ? <ConditionChip key={p.id} rect={rect} label={p.label} /> : null;
      })}
      {projection.nodes.map((n) => {
        const at = layout.positions[n.id] ?? n.position;
        const move = `translate(${r(at.x)} ${r(at.y)})`;
        if (isStepNode(n)) {
          const actor = doc.actors.find((a) => a.id === who[n.originId]);
          return (
            <g key={n.id} transform={move}>
              <StepTileArt
                clipId={`${idPrefix}-${n.id}`}
                actor={actor}
                accessories={accessoriesFor(doc, lane, actor)}
                kind={n.stepKind}
                title={n.title}
                detail={n.detail}
              />
            </g>
          );
        }
        return (
          <g key={n.id} transform={move}>
            <DataTileArt label={n.label} color={n.color} />
          </g>
        );
      })}
    </g>
  );
}
