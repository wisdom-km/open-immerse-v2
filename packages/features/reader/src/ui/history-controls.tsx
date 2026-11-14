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
          title={historyTitle(label)}
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

function historyTitle(label: "后退" | "前进"): string {
  const mac = /Mac|iPhone|iPad/.test(navigator.platform);
  if (label === "后退") return mac ? "后退（⌘[）" : "后退（Alt+←）";
  return mac ? "前进（⌘]）" : "前进（Alt+→）";
}
