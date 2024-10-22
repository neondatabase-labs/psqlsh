import "./style.css";
import { App } from "./lib/app";
import { hideBanner, showBanner } from "./lib/promo";

const app = new App();
app.start();
document.getElementById("info")!.addEventListener("click", showBanner);
document.getElementById("back")!.addEventListener("click", hideBanner);
