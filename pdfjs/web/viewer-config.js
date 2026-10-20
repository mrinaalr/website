// Site overrides for the PDF.js 6.4.299 viewer (system theme, page-width zoom).
document.addEventListener("webviewerloaded", () => {
  const options = window.PDFViewerApplicationOptions;
  options.set("disablePreferences", true);
  options.set("viewerCssTheme", 0);
  options.set("defaultZoomValue", "page-width");
});
