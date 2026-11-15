import { useLayoutEffect, useRef } from "react";

import type { GoToHandle } from "./go-to-page.js";

export type ZoomNav = {
  readonly zoomIn: () => void;
  readonly zoomOut: () => void;
  readonly zoomActual: () => void;
  readonly zoomFitWidth: () => void;
  readonly zoomFitPage: () => void;
};

export type ReaderNav = ZoomNav & {
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
  openGoTo: { readonly current: GoToHandle | undefined },
  zoom: ZoomNav,
): ReaderNav {
  return {
    back() {
      if (openGoTo.current?.closeOnBack() === true) return;
      if (nav.canBack) nav.back();
      else leave();
    },
    forward() {
      nav.forward();
    },
    openGoTo() {
      openGoTo.current?.open();
    },
    ...zoom,
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
    bind?.(
      Object.fromEntries(
        (Object.keys(latest.current) as (keyof ReaderNav)[]).map((key) => [
          key,
          call(key),
        ]),
      ) as ReaderNav,
    );
    return () => {
      bind?.(undefined);
    };
  }, [bind]);
}
