import type { ReactElement } from "react";

export function HistoryControls(props: {
  readonly canBack: boolean;
  readonly canForward: boolean;
  readonly onBack: () => void;
  readonly onForward: () => void;
}): ReactElement {
  const steps = [
    ["后退", "←", props.canBack, props.onBack],
    ["前进", "→", props.canForward, props.onForward],
  ] as const;
  return (
    <>
      {steps.map(([label, glyph, enabled, onClick]) => (
        <button
          key={label}
          type="button"
          className="oi-reader-back"
          aria-label={label}
          title={label}
          aria-disabled={enabled ? undefined : true}
          onClick={() => {
            if (enabled) onClick();
          }}
        >
          {glyph}
        </button>
      ))}
    </>
  );
}
