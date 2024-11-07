import "./style.css";
import { analytics } from "./lib/analytics";
import "./lib/sentry";
import { App, AppMode } from "./lib/app";

const app = new App(AppMode.Normal, document.getElementById("app")!);

app.start();
// @ts-ignore
window.app = app;
document.querySelectorAll(".signup").forEach((el) => {
  el.addEventListener("click", () => {
    analytics.track("signup_clicked");
  });
});
