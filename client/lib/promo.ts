export function showBanner() {
  document.body.classList.add("banner-visible");
  const hideOnEsc = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      hideBanner();
      window.removeEventListener("keydown", hideOnEsc);
    }
  };
  window.addEventListener("keydown", hideOnEsc);
}

export function hideBanner() {
  document.body.classList.remove("banner-visible");
  document.getElementById("app")!.focus();
}
