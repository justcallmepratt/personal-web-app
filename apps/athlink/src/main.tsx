import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { DemoBanner } from "./DemoBanner.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <>
    {/* Keeps the last row of each screen clear of the fixed banner. */}
    <div style={{ paddingBottom: "3rem" }}>
      <App />
    </div>
    <DemoBanner />
  </>,
);
