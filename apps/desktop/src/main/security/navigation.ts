export function decideNavigation(): "prevent" {
  return "prevent";
}

export function decideWindowOpen(): { readonly action: "deny" } {
  return { action: "deny" };
}

export function decideWebViewAttach(): "prevent" {
  return "prevent";
}

/** 只有显式 allow 才放行。当前决策不会返回 allow。 */
export function blockUnlessAllowed(
  decision: string,
  target: { preventDefault: () => void },
): void {
  if (decision === "allow") {
    return;
  }
  target.preventDefault();
}
