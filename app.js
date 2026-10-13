const $ = (id) => document.getElementById(id);
const recipes = window.RECIPES || [];
let activeTag = null;

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ytId = (url) => (url.match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/) || [])[1];

function renderTags() {
  const tags = [...new Set(recipes.flatMap((r) => r.tags || []))].sort();
  $("tags").innerHTML = tags
    .map((t) => `<button class="tag${t === activeTag ? " on" : ""}" data-tag="${esc(t)}">${esc(t)}</button>`)
    .join("");
}

function renderGrid() {
  const q = $("search").value.toLowerCase();
  const list = recipes.filter((r) => {
    if (activeTag && !(r.tags || []).includes(activeTag)) return false;
    return JSON.stringify(r).toLowerCase().includes(q);
  });
  $("grid").innerHTML = list.length
    ? list.map((r) => {
        const id = ytId(r.url);
        const img = id ? `<img loading="lazy" src="https://i.ytimg.com/vi/${id}/mqdefault.jpg" alt="">` : "";
        return `<div class="card" data-id="${esc(r.id)}">${img}<div><h3>${esc(r.title)}</h3>
          <span class="meta">${esc(r.time || "")}${r.servings ? " · serves " + esc(r.servings) : ""}</span></div></div>`;
      }).join("")
    : `<p class="meta">No recipes found.</p>`;
}

function showDetail(id) {
  const r = recipes.find((x) => x.id === id);
  if (!r) return;
  $("detail").innerHTML = `
    <button class="back">← All recipes</button>
    <h2>${esc(r.title)}</h2>
    <p class="meta">${esc(r.channel || "")} · ${esc(r.time || "")}${r.servings ? " · serves " + esc(r.servings) : ""}
      · <a href="${esc(r.url)}" target="_blank" rel="noopener">Watch video</a></p>
    <h3>Ingredients</h3><ul>${(r.ingredients || []).map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
    <h3>Steps</h3><ol>${(r.steps || []).map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
    ${r.notes ? `<h3>Notes</h3><p>${esc(r.notes)}</p>` : ""}`;
  $("detail").hidden = false;
  $("grid").hidden = $("tags").hidden = true;
  document.querySelector("header").hidden = true;
  location.hash = id;
  window.scrollTo(0, 0);
}

function showList() {
  $("detail").hidden = true;
  $("grid").hidden = $("tags").hidden = false;
  document.querySelector("header").hidden = false;
  history.replaceState(null, "", location.pathname);
}

$("search").addEventListener("input", renderGrid);
$("tags").addEventListener("click", (e) => {
  const t = e.target.dataset.tag;
  if (!t) return;
  activeTag = activeTag === t ? null : t;
  renderTags();
  renderGrid();
});
$("grid").addEventListener("click", (e) => {
  const c = e.target.closest(".card");
  if (c) showDetail(c.dataset.id);
});
$("detail").addEventListener("click", (e) => {
  if (e.target.classList.contains("back")) showList();
});

renderTags();
renderGrid();
if (location.hash.length > 1) showDetail(decodeURIComponent(location.hash.slice(1)));
