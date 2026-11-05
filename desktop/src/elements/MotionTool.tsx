import {
  AMBIENT_DEFAULTS,
  LINE_FLOW_DEFAULTS,
  type AmbientKind,
  type AmbientMotion,
  type AmbientRhythm,
  type ElementPatch,
  type LineElement,
  type LineFlow,
  type SvgElement,
} from '@slidr/model';
import { riderSize } from '@slidr/renderer';
import { cx, Field, Icon, SegmentedControl, type LucideIcon } from '@slidr/ui';
import {
  BellRing,
  Circle,
  CircleOff,
  Ellipsis,
  HeartPulse,
  MoveVertical,
  Orbit,
  RotateCcw,
  RotateCw,
  Sparkle,
  Square,
} from '@slidr/ui/icons';
import { useTranslation } from 'react-i18next';
import { useGestureTx } from '../controls';
import { ColorRow, PopoverTool, SliderField } from '../objects/parts';
import { isTarget, useTarget, type Target } from '../objects/target';
import { pieceMarkup, pieceOf, pieceSpeed, PIECE_SPEEDS } from './motion';
import type { PicturePiece } from './motionPieces';

/*
 * Row B's Motion tool (ADR-128): the motion an element repeats while it is shown, any element,
 * and how fast an animation of Elements (ADR-127) moves. A turning hexagon is a hexagon with a
 * turn; a picture of Elements moves by itself, and can take a motion besides. For a line, what
 * runs along it (ADR-131): its dashes, and boxes or dots that ride it.
 */

const KINDS: readonly (AmbientKind | 'none')[] = [
  'none',
  'spin',
  'pulse',
  'float',
  'swing',
  'blink',
];

/** The picture of each kind of motion: on its button here, and on a tile of an animated shape. */
export const KIND_ICONS: Record<AmbientKind | 'none', LucideIcon> = {
  none: CircleOff,
  spin: RotateCw,
  pulse: HeartPulse,
  float: MoveVertical,
  swing: BellRing,
  blink: Sparkle,
};

const RHYTHMS: readonly AmbientRhythm[] = ['steady', 'smooth', 'pause'];

/** The ready speeds, as a share of the kind's own round: twice as long, its own, half as long. */
const PACES = { slow: 2, medium: 1, fast: 0.5 } as const;
type Pace = keyof typeof PACES;

/** The round a slider offers, in seconds. */
const ROUND = { min: 0.3, max: 20, step: 0.1 } as const;

/**
 * How far each kind goes, as the slider shows it: a share of the size or of the opacity in
 * percent, slide pixels, degrees. `scale` turns the slider's number into the stored amount.
 */
const AMOUNTS: Record<
  Exclude<AmbientKind, 'spin'>,
  { min: number; max: number; step: number; unit: string; scale: number }
> = {
  pulse: { min: 2, max: 100, step: 1, unit: '%', scale: 0.01 },
  float: { min: 2, max: 200, step: 1, unit: 'px', scale: 1 },
  swing: { min: 2, max: 90, step: 1, unit: '°', scale: 1 },
  blink: { min: 10, max: 100, step: 5, unit: '%', scale: 0.01 },
};

/** The ready speed a round is, if it is one. */
function paceOf(motion: AmbientMotion): Pace | 'custom' {
  const own = AMBIENT_DEFAULTS[motion.kind].duration;
  const found = (Object.keys(PACES) as Pace[]).find(
    (pace) => Math.abs(own * PACES[pace] - motion.duration) < 1,
  );
  return found ?? 'custom';
}

/** A new motion of a kind: its own round, rhythm and reach. */
export function newAmbient(kind: AmbientKind): AmbientMotion {
  return { kind, duration: AMBIENT_DEFAULTS[kind].duration };
}

function useMotionUpdate(target: Target) {
  const { t } = useTranslation('elements');
  const tx = useGestureTx();
  return {
    /** Every step of a drag; `end` closes the undo step. */
    set: (ambient: AmbientMotion | null) =>
      target.update({ ambient }, { txId: tx.id(), label: t('history.motion') }),
    /** A whole change at once: its own undo step. */
    once: (ambient: AmbientMotion | null) => {
      target.update({ ambient }, { txId: tx.id(), label: t('history.motion') });
      tx.end();
    },
    end: tx.end,
  };
}

function KindPicker({
  value,
  onChange,
}: {
  value: AmbientKind | 'none';
  onChange: (kind: AmbientKind | 'none') => void;
}) {
  const { t } = useTranslation('elements');
  return (
    <div role="group" aria-label={t('motion.loop')} className="grid grid-cols-3 gap-1">
      {KINDS.map((kind) => (
        <button
          key={kind}
          type="button"
          aria-pressed={value === kind}
          data-motion-kind={kind}
          onClick={() => onChange(kind)}
          className={cx(
            'flex cursor-default flex-col items-center gap-1 rounded-control px-1 py-1.5 text-xs text-ui-fg-muted transition-colors hover:bg-ui-hover hover:text-ui-fg',
            'aria-pressed:bg-ui-thumb aria-pressed:text-ui-fg aria-pressed:shadow-raised',
          )}
        >
          <Icon icon={KIND_ICONS[kind]} />
          <span className="truncate">{t(`motion.kind.${kind}`)}</span>
        </button>
      ))}
    </div>
  );
}

/** The controls of a motion an element has: its speed, its rhythm, its way and its reach. */
function AmbientControls({ target, motion }: { target: Target; motion: AmbientMotion }) {
  const { t } = useTranslation('elements');
  const { set, once, end } = useMotionUpdate(target);
  const own = AMBIENT_DEFAULTS[motion.kind];
  const rhythm = motion.rhythm ?? own.rhythm;
  const reach = motion.kind === 'spin' ? undefined : AMOUNTS[motion.kind];
  const amount = motion.amount ?? own.amount;
  return (
    <>
      <Field label={t('motion.speed')}>
        <SegmentedControl<Pace | 'custom'>
          aria-label={t('motion.speed')}
          size="sm"
          fill
          options={(Object.keys(PACES) as Pace[]).map((pace) => ({
            value: pace,
            label: t(`motion.pace.${pace}`),
          }))}
          value={paceOf(motion)}
          onValueChange={(pace) => {
            if (pace !== 'custom') once({ ...motion, duration: own.duration * PACES[pace] });
          }}
        />
      </Field>
      <SliderField
        label={t('motion.round')}
        value={Math.round(motion.duration / 100) / 10}
        min={ROUND.min}
        max={ROUND.max}
        step={ROUND.step}
        onChange={(seconds) =>
          set({ ...motion, duration: Math.round(Math.max(ROUND.min, seconds) * 1000) })
        }
        onCommit={end}
      />
      <Field label={t('motion.rhythm')}>
        <SegmentedControl<AmbientRhythm>
          aria-label={t('motion.rhythm')}
          size="sm"
          fill
          options={RHYTHMS.map((value) => ({ value, label: t(`motion.rhythmKind.${value}`) }))}
          value={rhythm}
          onValueChange={(next) => once({ ...motion, rhythm: next })}
        />
      </Field>
      {(motion.kind === 'spin' || motion.kind === 'swing') && (
        <Field label={t('motion.direction')}>
          <SegmentedControl<'forward' | 'back'>
            aria-label={t('motion.direction')}
            size="sm"
            fill
            options={[
              { value: 'forward', label: t('motion.clockwise'), icon: RotateCw, iconOnly: true },
              {
                value: 'back',
                label: t('motion.counterclockwise'),
                icon: RotateCcw,
                iconOnly: true,
              },
            ]}
            value={motion.reverse ? 'back' : 'forward'}
            onValueChange={(way) => {
              const { reverse: _was, ...rest } = motion;
              once(way === 'back' ? { ...rest, reverse: true } : rest);
            }}
          />
        </Field>
      )}
      {reach && motion.kind !== 'spin' && (
        <SliderField
          label={t(`motion.amount.${motion.kind}`)}
          value={Math.round(amount / reach.scale)}
          min={reach.min}
          max={reach.max}
          step={reach.step}
          unit={reach.unit}
          onChange={(shown) => set({ ...motion, amount: shown * reach.scale })}
          onCommit={end}
        />
      )}
    </>
  );
}

/** How fast an animation of Elements moves: its picture drawn again at that speed. */
function PieceSpeed({ target, piece }: { target: Target<SvgElement>; piece: PicturePiece }) {
  const { t } = useTranslation('elements');
  const tx = useGestureTx();
  return (
    <SliderField
      label={t('motion.piece')}
      value={pieceSpeed(target.element.markup ?? '')}
      min={PIECE_SPEEDS.min}
      max={PIECE_SPEEDS.max}
      step={0.25}
      unit="×"
      onChange={(speed) =>
        target.update(
          { markup: pieceMarkup(piece, speed) },
          { txId: tx.id(), label: t('history.motion') },
        )
      }
      onCommit={tx.end}
    />
  );
}

/** What runs along a line (ADR-131): nothing, its dashes alone, or boxes or dots besides. */
const FLOWS = ['none', 'dashes', 'box', 'dot'] as const;
type FlowChoice = (typeof FLOWS)[number];

const FLOW_ICONS: Record<FlowChoice, LucideIcon> = {
  none: CircleOff,
  dashes: Ellipsis,
  box: Square,
  dot: Circle,
};

/** The pace a slider offers, in slide pixels a second. */
const FLOW_SPEED = { min: 10, max: 600, step: 5 } as const;
/** A rider's longest side a slider offers, in slide pixels. */
const RIDER_SIZE = { min: 4, max: 120, step: 1 } as const;
/** How many riders a slider offers. */
const RIDERS = { min: 1, max: 12 } as const;

function flowChoice(flow: LineFlow | undefined): FlowChoice {
  if (!flow) return 'none';
  return flow.rider && flow.rider !== 'none' ? flow.rider : 'dashes';
}

/** The ready pace a flow goes at, if it is one: twice, once or half the time of the default. */
function flowPaceOf(flow: LineFlow): Pace | 'custom' {
  const found = (Object.keys(PACES) as Pace[]).find(
    (pace) => Math.abs(LINE_FLOW_DEFAULTS.speed / PACES[pace] - flow.speed) < 0.5,
  );
  return found ?? 'custom';
}

/** The ways a flow chooser offers, each with its picture. */
function FlowPicker({
  value,
  onChange,
}: {
  value: FlowChoice;
  onChange: (choice: FlowChoice) => void;
}) {
  const { t } = useTranslation('elements');
  return (
    <div role="group" aria-label={t('motion.flow.title')} className="grid grid-cols-4 gap-1">
      {FLOWS.map((choice) => (
        <button
          key={choice}
          type="button"
          aria-pressed={value === choice}
          data-flow={choice}
          onClick={() => onChange(choice)}
          className={cx(
            'flex cursor-default flex-col items-center gap-1 rounded-control px-1 py-1.5 text-xs text-ui-fg-muted transition-colors hover:bg-ui-hover hover:text-ui-fg',
            'aria-pressed:bg-ui-thumb aria-pressed:text-ui-fg aria-pressed:shadow-raised',
          )}
        >
          <Icon icon={FLOW_ICONS[choice]} />
          <span className="truncate">{t(`motion.flow.kind.${choice}`)}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * What runs along a line (ADR-131): the choice of it, and how it goes. A flow of dashes on a
 * line drawn solid makes the line dashed too, in the same step, or nothing would be seen to move.
 */
function FlowControls({ target }: { target: Target<LineElement> }) {
  const { t } = useTranslation('elements');
  const tx = useGestureTx();
  const { flow, stroke } = target.element;
  /** Every step of a drag; `tx.end` closes the undo step. */
  const set = (patch: ElementPatch) =>
    target.update(patch, { txId: tx.id(), label: t('history.motion') });
  /** A whole change at once: its own undo step. */
  const once = (patch: ElementPatch) => {
    set(patch);
    tx.end();
  };
  const choice = flowChoice(flow);
  const choose = (next: FlowChoice) => {
    if (next === choice) return;
    if (next === 'none') return once({ flow: null });
    const { rider: _was, ...rest } = flow ?? { speed: LINE_FLOW_DEFAULTS.speed };
    const shown: LineFlow = next === 'dashes' ? rest : { ...rest, rider: next };
    const solid = !stroke.dash || stroke.dash === 'solid';
    once(
      next === 'dashes' && solid
        ? { flow: shown, stroke: { ...stroke, dash: 'dashed', cap: stroke.cap ?? 'round' } }
        : { flow: shown },
    );
  };
  const rides = flow?.rider !== undefined && flow.rider !== 'none';
  return (
    <>
      <Field label={t('motion.flow.title')}>
        <FlowPicker value={choice} onChange={choose} />
      </Field>
      {flow && (
        <>
          <Field label={t('motion.speed')}>
            <SegmentedControl<Pace | 'custom'>
              aria-label={t('motion.speed')}
              size="sm"
              fill
              options={(Object.keys(PACES) as Pace[]).map((pace) => ({
                value: pace,
                label: t(`motion.pace.${pace}`),
              }))}
              value={flowPaceOf(flow)}
              onValueChange={(pace) => {
                if (pace === 'custom') return;
                once({ flow: { ...flow, speed: LINE_FLOW_DEFAULTS.speed / PACES[pace] } });
              }}
            />
          </Field>
          <SliderField
            label={t('motion.flow.speed')}
            value={Math.round(flow.speed)}
            min={FLOW_SPEED.min}
            max={FLOW_SPEED.max}
            step={FLOW_SPEED.step}
            onChange={(speed) => set({ flow: { ...flow, speed: Math.max(FLOW_SPEED.min, speed) } })}
            onCommit={tx.end}
          />
          <Field label={t('motion.direction')}>
            <SegmentedControl<'forward' | 'back'>
              aria-label={t('motion.direction')}
              size="sm"
              fill
              options={[
                { value: 'forward', label: t('motion.flow.forward') },
                { value: 'back', label: t('motion.flow.back') },
              ]}
              value={flow.reverse ? 'back' : 'forward'}
              onValueChange={(way) => {
                const { reverse: _was, ...rest } = flow;
                once({ flow: way === 'back' ? { ...rest, reverse: true } : rest });
              }}
            />
          </Field>
          {rides && (
            <>
              <SliderField
                label={t('motion.flow.count')}
                value={flow.count ?? LINE_FLOW_DEFAULTS.count}
                min={RIDERS.min}
                max={RIDERS.max}
                step={1}
                onChange={(count) =>
                  set({
                    flow: {
                      ...flow,
                      count: Math.min(RIDERS.max, Math.max(RIDERS.min, Math.round(count))),
                    },
                  })
                }
                onCommit={tx.end}
              />
              <SliderField
                label={t('motion.flow.size')}
                value={Math.round(riderSize(flow, stroke))}
                min={RIDER_SIZE.min}
                max={RIDER_SIZE.max}
                step={RIDER_SIZE.step}
                unit="px"
                onChange={(size) =>
                  set({ flow: { ...flow, size: Math.max(RIDER_SIZE.min, size) } })
                }
                onCommit={tx.end}
              />
              <ColorRow
                label={t('motion.flow.color')}
                value={flow.color ?? stroke.color}
                onChange={(color) => set({ flow: { ...flow, color } })}
                onGestureEnd={tx.end}
              />
            </>
          )}
        </>
      )}
    </>
  );
}

/**
 * The Motion tool of row B, for one element of any kind. Its icon is the motion the element
 * repeats, if it has one.
 */
export function MotionTool() {
  const target = useTarget();
  return target ? <MotionPopover target={target} /> : null;
}

function MotionPopover({ target }: { target: Target }) {
  const { t } = useTranslation('elements');
  const { once, end } = useMotionUpdate(target);
  const motion = target.element.ambient;
  const piece = isTarget(target, 'svg') ? pieceOf(target.element) : undefined;
  return (
    <PopoverTool
      label={t('motion.title')}
      icon={motion ? KIND_ICONS[motion.kind] : Orbit}
      onClose={end}
    >
      <div data-testid="motion-tool" className="flex w-64 flex-col gap-3">
        {piece && isTarget(target, 'svg') && (
          <>
            <PieceSpeed target={target} piece={piece} />
            <hr className="border-ui-line" />
          </>
        )}
        {isTarget(target, 'line') && (
          <>
            <FlowControls target={target} />
            <hr className="border-ui-line" />
          </>
        )}
        <Field label={t('motion.loop')}>
          <KindPicker
            value={motion?.kind ?? 'none'}
            onChange={(kind) => {
              if (kind === (motion?.kind ?? 'none')) return;
              once(kind === 'none' ? null : newAmbient(kind));
            }}
          />
        </Field>
        {motion && <AmbientControls target={target} motion={motion} />}
        <p className="text-xs text-ui-fg-muted">{t('motion.hint')}</p>
      </div>
    </PopoverTool>
  );
}
