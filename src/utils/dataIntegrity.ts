import type { Establishment } from '../types';
import { computeDnb, computeCfg } from './calculations';

/** List of blocking business inconsistencies for completed exam results. */
export function collectDataIssues(establishments: Establishment[]): string[] {
  const issues: string[] = [];
  for (const est of establishments) {
    if (est.dnbComplete !== false) {
      for (const error of computeDnb(est.dnb, est.effectifClasse).errors)
        issues.push(`${est.name} (DNB) : ${error}`);
    }
    if (est.cfgComplete !== false) {
      for (const error of computeCfg(est.cfg, est.effectifClasse).errors)
        issues.push(`${est.name} (CFG) : ${error}`);
    }
  }
  return issues;
}
