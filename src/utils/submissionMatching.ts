import type { ColleagueSubmission, Establishment } from '../types';

export type SubmissionMatch =
  | { kind: 'existing'; index: number }
  | { kind: 'new' }
  | { kind: 'ambiguous' };

const normalized = (value: string | undefined) => (value || '').trim().toLocaleLowerCase('fr-FR');

/** Never select the first homonym silently, especially across geographic basins. */
export function resolveSubmissionTarget(
  submission: Pick<ColleagueSubmission, 'establishmentName' | 'bassin' | 'city'>,
  establishments: Establishment[],
): SubmissionMatch {
  const named = establishments
    .map((est, index) => ({ est, index }))
    .filter(({ est }) => normalized(est.name) === normalized(submission.establishmentName));
  const targetBassin = normalized(submission.bassin);
  const eligible = targetBassin
    ? named.filter(({ est }) => normalized(est.bassin) === targetBassin)
    : named;
  if (eligible.length === 0) return { kind: 'new' };
  if (eligible.length === 1) return { kind: 'existing', index: eligible[0].index };
  const targetCity = normalized(submission.city);
  const cityMatches = targetCity
    ? eligible.filter(({ est }) => normalized(est.city) === targetCity)
    : [];
  if (cityMatches.length === 1) return { kind: 'existing', index: cityMatches[0].index };
  return { kind: 'ambiguous' };
}
