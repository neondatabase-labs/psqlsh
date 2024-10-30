import "./style.css";
import { analytics } from "./lib/analytics";
import "./lib/sentry";
import { App } from "./lib/app";

const app = new App();
app.start();
document.querySelectorAll(".signup").forEach((el) => {
  el.addEventListener("click", () => {
    analytics.track("signup_clicked");
  });
});
