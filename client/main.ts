import "./style.css";
import { analytics } from "./lib/analytics";
import "./lib/sentry";
import { App, AppMode } from "./lib/app";

const mode: AppMode = import.meta.env.VITE_APP_MODE ?? AppMode.Normal;

const app = new App(mode, document.getElementById("app")!);

app.start();
// @ts-expect-error window is not typed
window.app = app;
document.querySelectorAll(".signup").forEach((el) => {
  el.addEventListener("click", () => {
    analytics.track("signup_clicked");
  });
});

document.querySelectorAll(".github-link").forEach((n) =>
  n.addEventListener("click", () => {
    analytics.track("github_clicked");
  }),
);
