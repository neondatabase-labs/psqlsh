import "./style.css";
import { analytics } from "./lib/analytics";
import "./lib/sentry";
import { App, AppMode } from "./lib/app";

const mode: AppMode = import.meta.env.VITE_APP_MODE ?? AppMode.Normal;

const app = new App(mode, document.getElementById("app")!);

app.start();
// @ts-ignore
window.app = app;
document.querySelectorAll(".signup").forEach((el) => {
  el.addEventListener("click", () => {
    analytics.track("signup_clicked");
  });
});
