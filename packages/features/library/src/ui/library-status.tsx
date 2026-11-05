import type { ReactElement } from "react";

export function LibraryStatus(props: { readonly text: string }): ReactElement {
  return <p role="status">{props.text}</p>;
}
