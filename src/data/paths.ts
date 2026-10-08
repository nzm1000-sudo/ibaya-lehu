import { type IconName } from '@/components/icon';

import { visible, type Approvable } from './curated';
import { getQA, type QA } from './qa';

/** Life-stage paths (assets/data/curated/paths.json): ordered answers with editor transition lines. */
export type PathStep = { id: string; note: string };
export type LifePath = Approvable & { key: string; title: string; subtitle: string; icon: IconName; reason: string; steps: PathStep[] };

const PATHS = (require('../../assets/data/curated/paths.json') as { items: LifePath[] }).items;

export function lifePaths(preview: boolean): LifePath[] {
  return visible(PATHS, preview);
}

export function getPath(key: string | undefined, preview: boolean): LifePath | undefined {
  return lifePaths(preview).find((p) => p.key === key);
}

/** Steps whose answer exists in the current data set. */
export function pathSteps(p: LifePath): { step: PathStep; q: QA }[] {
  return p.steps.map((step) => ({ step, q: getQA(step.id) })).filter((x): x is { step: PathStep; q: QA } => !!x.q);
}
