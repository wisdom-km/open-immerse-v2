import { createRoot } from "react-dom/client";

import { Shell } from "./shell.js";

const root = document.querySelector("#root");
if (root === null) {
  throw new Error("renderer");
}
createRoot(root).render(<Shell />);
