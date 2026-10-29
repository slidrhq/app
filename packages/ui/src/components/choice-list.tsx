import { useId, type ReactNode } from 'react';
import { RadioGroup } from 'radix-ui';
import { Check } from 'lucide-react';
import { cx } from '../cx';

export interface Choice<T extends string> {
  value: T;
  /** The text of the row, and its accessible name. */
  label: string;
  /** Drawn before the label, and not read out: a mark or a picture of the choice. */
  start?: ReactNode;
  /** A line under the label that says what the choice does: its description, not its name. */
  description?: string;
  /** Shown, and not chosen: the arrows go past it. */
  disabled?: boolean;
}

export interface ChoiceListProps<T extends string> {
  options: readonly Choice<T>[];
  /** The chosen one; empty while none is. */
  value: T | '';
  onValueChange: (value: T) => void;
  /** Names the list for screen readers: this, or the id of what names it. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  /** The way the rows read, where it is not the page's: names of products read left to right. */
  dir?: 'ltr' | 'rtl';
  className?: string;
}

/**
 * One choice out of a list, a row each: the options of a step of a setup, read down a narrow
 * panel. The rows are one grouped list, not a card each, so they stay compact; the arrows go from
 * one to the next, and Enter in a form sends it, as from a radio button of the system.
 */
export function ChoiceList<T extends string>({
  options,
  value,
  onValueChange,
  dir,
  className,
  ...aria
}: ChoiceListProps<T>) {
  const id = useId();
  return (
    <RadioGroup.Root
      dir={dir}
      value={value}
      onValueChange={(next) => onValueChange(next as T)}
      className={cx(
        'flex flex-col divide-y divide-ui-line overflow-hidden rounded-control border border-ui-line',
        className,
      )}
      {...aria}
    >
      {options.map((option, index) => (
        <RadioGroup.Item
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          aria-labelledby={option.description ? `${id}-${index}` : undefined}
          aria-describedby={option.description ? `${id}-${index}-description` : undefined}
          // Radix keeps Enter from choosing, as the pattern of a radio group has it; in a form it
          // still sends the form.
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.form?.requestSubmit();
          }}
          className="flex min-h-10 w-full cursor-default items-center gap-2.5 px-2.5 py-1.5 text-start text-sm text-ui-fg transition-colors outline-none hover:bg-ui-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ui-focus disabled:opacity-50 disabled:hover:bg-transparent data-[state=checked]:bg-ui-accent-soft"
        >
          {option.start ? (
            <span aria-hidden="true" className="flex shrink-0">
              {option.start}
            </span>
          ) : null}
          <span className="flex min-w-0 flex-1 flex-col break-words">
            <bdi id={`${id}-${index}`}>{option.label}</bdi>
            {option.description ? (
              <span
                id={`${id}-${index}-description`}
                className="text-xs leading-5 text-ui-fg-muted"
              >
                {option.description}
              </span>
            ) : null}
          </span>
          <RadioGroup.Indicator className="shrink-0 text-ui-accent-fg">
            <Check aria-hidden size={16} />
          </RadioGroup.Indicator>
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
