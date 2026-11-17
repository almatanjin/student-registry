import { CLASSIFICATION_TONES } from "@/components/result-badges";
import { Pill } from "@/components/status-badge";
import { gradeBandLabels } from "@/domain/results";

/** "Bands:" followed by one pill per classification, coloured like the classification pills in a marksheet. */
export function GradeBandsLegend() {
  return (
    // Inline flow, so the pills wrap one at a time and the first ones stay on the line with "Bands:".
    <div className="-mb-1.5">
      <span className="mr-1.5">Bands:</span>
      <ul aria-label="Grade bands" className="inline">
        {gradeBandLabels().map((band) => (
          <li key={band.classification} className="mr-1.5 mb-1.5 inline-block">
            <Pill tone={CLASSIFICATION_TONES[band.classification]}>{band.label}</Pill>
          </li>
        ))}
      </ul>
    </div>
  );
}
