import {
  AMBIENT_DEFAULTS,
  type AmbientKind,
  type AmbientMotion,
  type AmbientRhythm,
  type SvgElement,
} from '@slidr/model';
import { cx, Field, Icon, SegmentedControl, type LucideIcon } from '@slidr/ui';
import {
  BellRing,
  CircleOff,
  HeartPulse,
  MoveVertical,
  Orbit,
  RotateCcw,
  RotateCw,
  Sparkle,
} from '@slidr/ui/icons';
import { useTranslation } from 'react-i18next';
import { useGestureTx } from '../controls';
import { PopoverTool, SliderField } from '../objects/parts';
import { isTarget, useTarget, type Target } from '../objects/target';
import { pieceMarkup, pieceOf, pieceSpeed, PIECE_SPEEDS } from './motion';
import type { MotionPiece } from './motionPieces';

/*
 * Row B's Motion tool (ADR-128): the motion an element repeats while it is shown, any element,
 * and how fast an animation of Elements (ADR-127) moves. A turning hexagon is a hexagon with a
 * turn; a picture of Elements moves by itself, and can take a motion besides.
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
function PieceSpeed({ target, piece }: { target: Target<SvgElement>; piece: MotionPiece }) {
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
