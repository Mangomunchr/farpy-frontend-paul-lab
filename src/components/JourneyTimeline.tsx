import {
  journeyProgressValue,
  journeyStateLabel,
  worldTimelineSteps,
  type WorldJourneyState,
  type WorldTimelineStepId,
} from "@/lib/worldLanguage";

export type JourneyTimelineStateMap = Partial<Record<WorldTimelineStepId, WorldJourneyState>>;

export function JourneyTimeline({
  states,
  label = "Package journey",
  includePaymentStep = false,
}: {
  states: JourneyTimelineStateMap;
  label?: string;
  includePaymentStep?: boolean;
}) {
  const steps = includePaymentStep ? worldTimelineSteps : worldTimelineSteps.filter((step) => step.id !== "payment");

  return (
    <ol className="world-journey" aria-label={label}>
      {steps.map((step) => {
        const state = states[step.id] || "upcoming";
        const progress = journeyProgressValue(state);
        return (
          <li className={`world-journey-card world-journey-card-${state}`} key={step.id}>
            <div className="world-journey-card-head">
              <span className="world-journey-icon" aria-hidden="true">{step.icon}</span>
              <div>
                <strong>{step.label}</strong>
                <small>{step.currentSentence}</small>
              </div>
            </div>
            <div className="world-journey-progress" aria-hidden="true">
              <span style={{ width: `${progress}%` }} />
            </div>
            <span className="world-journey-state">{journeyStateLabel(state)}</span>
          </li>
        );
      })}
    </ol>
  );
}
