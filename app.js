const $ = (id) => document.getElementById(id);
const recipes = window.RECIPES || [];
let activeTag = null;
let pantry = [];
try { pantry = JSON.parse(localStorage.getItem("pantry") || "[]"); } catch (e) {}
const savePantry = () => { try { localStorage.setItem("pantry", JSON.stringify(pantry)); } catch (e) {} };

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ytId = (url) => ((url || "").match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/) || [])[1];
const thumb = (r) => r.image || (ytId(r.url) ? `https://i.ytimg.com/vi/${ytId(r.url)}/mqdefault.jpg` : "");

// Assumed always on hand, so they never count as missing.
const STAPLES = ["salt", "pepper", "water", "cooking spray", "oil"];
const norm = (s) => s.toLowerCase().replace(/yoghurt/g, "yogurt").replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim()
  .split(" ").map((w) => w.replace(/(es|s)$/, "")).join(" ");
const hasTerm = (line, term) => {
  const t = norm(term);
  return t.length > 0 && (" " + norm(line) + " ").includes(" " + t + " ");
};

// Over required lines only: skips section headers ("Dough:"), optional items and "mixture" lines (made earlier in the recipe).
function matchRecipe(r) {
  const lines = (r.ingredients || []).filter((i) => !i.trim().endsWith(":") && !/optional|mixture/i.test(i));
  const have = [], missing = [];
  for (const line of lines) {
    const ok = STAPLES.some((s) => hasTerm(line, s)) || pantry.some((p) => hasTerm(line, p));
    (ok ? have : missing).push(line);
  }
  return { have, missing, total: lines.length };
}

function renderTags() {
  const tags = [...new Set(recipes.flatMap((r) => r.tags || []))].sort();
  $("tags").innerHTML = tags
    .map((t) => `<button class="tag${t === activeTag ? " on" : ""}" data-tag="${esc(t)}">${esc(t)}</button>`)
    .join("");
}

function renderPantry() {
  $("pantry-chips").innerHTML = pantry
    .map((p, i) => `<button class="chip" data-i="${i}" title="Remove">${esc(p)} ×</button>`)
    .join("");
}

function renderGrid() {
  const q = $("search").value.toLowerCase();
  const usePantry = pantry.length > 0;
  let list = recipes
    .filter((r) => {
      if (activeTag && !(r.tags || []).includes(activeTag)) return false;
      return JSON.stringify(r).toLowerCase().includes(q);
    })
    .map((r) => ({ r, m: matchRecipe(r) }));
  if (usePantry) {
    if ($("only-full").checked) list = list.filter((x) => x.m.missing.length === 0);
    list.sort((a, b) => b.m.have.length / b.m.total - a.m.have.length / a.m.total);
  }
  $("grid").innerHTML = list.length
    ? list.map(({ r, m }) => {
        const src = thumb(r);
        const img = src ? `<img loading="lazy" src="${esc(src)}" alt="">` : "";
        const badge = usePantry
          ? `<span class="badge${m.missing.length ? "" : " full"}">${
              m.missing.length ? `have ${m.have.length}/${m.total} · missing ${m.missing.length}` : "You can make this"
            }</span>`
          : "";
        return `<div class="card" data-id="${esc(r.id)}">${img}<div><h3>${esc(r.title)}</h3>
          <span class="meta">${esc(r.time || "")}${r.servings ? " · serves " + esc(r.servings) : ""}</span>${badge}</div></div>`;
      }).join("")
    : `<p class="meta">No recipes found.</p>`;
}

function showDetail(id) {
  const r = recipes.find((x) => x.id === id);
  if (!r) return;
  const missing = new Set(matchRecipe(r).missing);
  $("detail").innerHTML = `
    <button class="back">← All recipes</button>
    <h2>${esc(r.title)}</h2>
    ${r.image ? `<img class="hero" src="${esc(r.image)}" alt="">` : ""}
    <p class="meta">${[r.channel, r.time, r.servings ? "serves " + r.servings : ""].filter(Boolean).map(esc).join(" · ")}${
      r.url ? ` · <a href="${esc(r.url)}" target="_blank" rel="noopener">Watch video</a>` : ""}</p>
    <h3>Ingredients</h3><ul>${(r.ingredients || [])
      .map((i) => `<li${pantry.length && missing.has(i) ? ' class="miss"' : ""}>${esc(i)}</li>`).join("")}</ul>
    ${pantry.length ? `<p class="meta">Red = not in your ingredients.</p>` : ""}
    <h3>Steps</h3><ol>${(r.steps || []).map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
    ${r.notes ? `<h3>Notes</h3><p>${esc(r.notes)}</p>` : ""}`;
  $("detail").hidden = false;
  $("grid").hidden = $("tags").hidden = $("pantry").hidden = true;
  document.querySelector("header").hidden = true;
  window.scrollTo(0, 0);
}

function showList() {
  $("detail").hidden = true;
  $("grid").hidden = $("tags").hidden = $("pantry").hidden = false;
  document.querySelector("header").hidden = false;

}

$("search").addEventListener("input", renderGrid);
$("only-full").addEventListener("change", renderGrid);
$("pantry-input").addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== ",") return;
  e.preventDefault();
  const v = e.target.value.trim().toLowerCase();
  if (v && !pantry.includes(v)) { pantry.push(v); savePantry(); renderPantry(); renderGrid(); }
  e.target.value = "";
});
$("pantry-chips").addEventListener("click", (e) => {
  const i = e.target.dataset.i;
  if (i === undefined) return;
  pantry.splice(+i, 1); savePantry(); renderPantry(); renderGrid();
});
$("tags").addEventListener("click", (e) => {
  const t = e.target.dataset.tag;
  if (!t) return;
  activeTag = activeTag === t ? null : t;
  renderTags();
  renderGrid();
});
$("grid").addEventListener("click", (e) => {
  const c = e.target.closest(".card");
  if (c) location.hash = encodeURIComponent(c.dataset.id);
});
$("detail").addEventListener("click", (e) => {
  if (e.target.classList.contains("back")) location.hash = "";
});

renderTags();
renderPantry();
renderGrid();
function route() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (id && recipes.some((r) => r.id === id)) showDetail(id); else showList();
}
window.addEventListener("hashchange", route);
route();
