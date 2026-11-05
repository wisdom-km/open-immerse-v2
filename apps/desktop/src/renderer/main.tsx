import { createRoot } from "react-dom/client";

import { slots } from "./slots.js";

const root = document.querySelector("#root");
const contribution = slots[0];
if (root === null || contribution === undefined) {
  throw new Error("renderer");
}
createRoot(root).render(<contribution.component />);
