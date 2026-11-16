import { Pill, type Tone } from "@/components/status-badge";
import { RESULT_STATE_LABELS, type Classification, type ResultState } from "@/domain/results";

const CLASSIFICATION: Record<Classification, Tone> = {
  Distinction: "purple",
  Merit: "blue",
  Pass: "green",
  Fail: "red",
};

const STATE: Record<ResultState, Tone> = {
  PENDING: "sky",
  PUBLISHED: "green",
  WITHHELD: "purple",
};

export function ClassificationBadge({ classification }: { classification: Classification }) {
  return <Pill tone={CLASSIFICATION[classification]}>{classification}</Pill>;
}

export function ResultStateBadge({ state }: { state: ResultState }) {
  return <Pill tone={STATE[state]}>{RESULT_STATE_LABELS[state]}</Pill>;
}
