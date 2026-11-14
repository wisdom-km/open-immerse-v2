import { useLayoutEffect, useRef } from "react";

export type ReaderNav = {
  readonly back: () => void;
  readonly forward: () => void;
  readonly openGoTo: () => void;
};

type History = {
  readonly canBack: boolean;
  readonly back: () => void;
  readonly forward: () => void;
};

export function navCommands(
  nav: History,
  leave: () => void,
  openGoTo: { readonly current: (() => void) | undefined },
): ReaderNav {
  return {
    back() {
      if (nav.canBack) nav.back();
      else leave();
    },
    forward() {
      nav.forward();
    },
    openGoTo() {
      openGoTo.current?.();
    },
  };
}

export function useBoundNav(
  bind: ((nav: ReaderNav | undefined) => void) | undefined,
  nav: ReaderNav,
): void {
  const latest = useRef(nav);
  latest.current = nav;
  useLayoutEffect(() => {
    const call = (key: keyof ReaderNav) => () => {
      latest.current[key]();
    };
    bind?.({
      back: call("back"),
      forward: call("forward"),
      openGoTo: call("openGoTo"),
    });
    return () => {
      bind?.(undefined);
    };
  }, [bind]);
}
