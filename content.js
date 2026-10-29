// Adds/removes html.cb-mode based on the stored toggle (default: on).
const root = document.documentElement;
root.classList.add("cb-mode");

chrome.storage.sync.get({ enabled: true }, ({ enabled }) => {
  root.classList.toggle("cb-mode", enabled);
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) root.classList.toggle("cb-mode", changes.enabled.newValue);
});

// Diffs and their +/- counts stay red/green. Their colors come from the same
// palette we remap, so read the original values and restore them in there.
const DIFF_SELECTORS = [
  ".diff-files-holder",
  ".diff-file",
  ".rd-diff-file",
  ".rd-text-view-content",
  ".diff-stats",
  ".diff-stats-group",
  ".rd-stats-added",
  ".rd-stats-removed",
  ".file-holder",
];
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const TOKENS = [
  ...STEPS.flatMap((s) => [`--gl-color-green-${s}`, `--gl-color-red-${s}`]),
  "--gl-text-color-success",
  "--gl-text-color-danger",
];

function restoreDiffColors() {
  const had = root.classList.contains("cb-mode");
  root.classList.remove("cb-mode");
  const styles = getComputedStyle(root);
  const decls = TOKENS.map((t) => [t, styles.getPropertyValue(t).trim()])
    .filter(([, v]) => v)
    .map(([t, v]) => `${t}: ${v} !important;`)
    .join("\n");
  if (had) root.classList.add("cb-mode");

  let style = document.getElementById("cb-diff-restore");
  if (!style) {
    style = document.createElement("style");
    style.id = "cb-diff-restore";
    document.head.appendChild(style);
  }
  const selector = DIFF_SELECTORS.map((s) => `html.cb-mode ${s}`).join(",\n");
  style.textContent = `${selector} {\n${decls}\n}`;
}

if (document.readyState === "complete") restoreDiffColors();
else window.addEventListener("load", restoreDiffColors);

// GitLab can switch to dark mode without a reload; re-read the palette then.
let dark = root.classList.contains("gl-dark");
new MutationObserver(() => {
  const nowDark = root.classList.contains("gl-dark");
  if (nowDark === dark) return;
  dark = nowDark;
  restoreDiffColors();
}).observe(root, { attributes: true, attributeFilter: ["class"] });
