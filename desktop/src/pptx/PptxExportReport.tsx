import type { PptxExportResult } from '@slidr/pptx';
import { Field, Icon, ScrollArea } from '@slidr/ui';
import { CircleCheck, TriangleAlert } from '@slidr/ui/icons';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { formatBytes, ltr, type Destination } from '../export/exportDeck';
import { WarningList } from './WarningList';

/*
 * What the export dialog shows after a PowerPoint export (ADR-108): what went into the file and
 * what PowerPoint shows otherwise than Slidr. Its words are the HTML report's where they say the
 * same (`export`).
 */

/** A count in words: one string for one, another for more. */
const counted = (t: TFunction, key: string, n: number): string =>
  n === 1 ? t(`${key}One`) : t(`${key}Many`, { n });

/** What went into the file. */
export function PptxExportReport({
  result,
  destination,
  seconds,
}: {
  result: PptxExportResult;
  destination: Destination;
  seconds: number;
}) {
  const { t } = useTranslation('export');
  const { t: tp } = useTranslation('pptx');
  const where = destination.kind === 'file' ? destination.path : destination.name;
  const warnings = result.warnings.filter((w) => w.code !== 'fonts');
  return (
    <div data-testid="pptx-export-report" className="flex flex-col gap-4">
      <div className="flex items-start gap-2">
        <Icon icon={CircleCheck} className="mt-0.5 text-ui-success-fg" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-medium">
            {destination.kind === 'file' ? t('done.saved') : t('done.downloaded')}
          </span>
          {/* A path reads left to right in every language. */}
          <span dir="ltr" className="truncate text-start text-xs text-ui-fg-muted">
            {where}
          </span>
          <span data-testid="pptx-export-summary" className="flex gap-1.5 text-xs text-ui-fg-muted">
            <bdi>{counted(t, 'done.slides', result.slides)}</bdi>·
            <bdi dir="ltr">{formatBytes(result.bytes.length)}</bdi>·
            <bdi>{t('done.seconds', { n: seconds.toFixed(1) })}</bdi>
          </span>
        </div>
      </div>
      <ScrollArea viewportClassName="max-h-72">
        <div className="flex flex-col gap-4 pe-3">
          {warnings.length > 0 && (
            <Field label={t('done.warnings')}>
              <WarningList warnings={warnings} group="exported" testId="pptx-export-warnings" />
            </Field>
          )}
          <Field label={t('done.assets')}>
            <span
              data-testid="pptx-export-media"
              className={result.media.files ? '' : 'text-ui-fg-muted'}
            >
              {result.media.files === 0
                ? tp('export.noMedia')
                : result.media.files === 1
                  ? tp('export.mediaOne', { size: ltr(formatBytes(result.media.bytes)) })
                  : tp('export.mediaMany', {
                      n: result.media.files,
                      size: ltr(formatBytes(result.media.bytes)),
                    })}
            </span>
          </Field>
          {result.fonts.length > 0 && (
            <Field label={tp('export.fonts')}>
              <span data-testid="pptx-export-fonts" className="flex items-start gap-2">
                <Icon icon={TriangleAlert} className="mt-0.5 shrink-0 text-ui-warning-fg" />
                <span>{tp('export.fontsBody')}</span>
              </span>
              <span className="text-xs text-ui-fg-muted">
                <bdi dir="ltr">{result.fonts.join(' · ')}</bdi>
              </span>
            </Field>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
