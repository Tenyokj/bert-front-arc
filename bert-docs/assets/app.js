(function () {
  const docs = window.BERT_DOCS || [];
  const navEl = document.getElementById("nav");
  const docEl = document.getElementById("doc");
  const pagerEl = document.getElementById("pager");
  const searchInput = document.getElementById("searchInput");

  let activeSlug = docs[0]?.slug || "";

  const bySlug = new Map(docs.map((d) => [d.slug, d]));

  function toText(html) {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  }

  function renderNav(filtered = docs) {
    const grouped = filtered.reduce((acc, doc) => {
      acc[doc.group] = acc[doc.group] || [];
      acc[doc.group].push(doc);
      return acc;
    }, {});

    navEl.innerHTML = "";

    Object.keys(grouped).forEach((group) => {
      const groupLabel = document.createElement("div");
      groupLabel.className = "nav-group";
      groupLabel.textContent = group;
      navEl.appendChild(groupLabel);

      grouped[group].forEach((doc) => {
        const btn = document.createElement("button");
        btn.textContent = doc.title;
        btn.className = doc.slug === activeSlug ? "active" : "";
        btn.onclick = function () {
          activeSlug = doc.slug;
          location.hash = doc.slug;
          renderDoc(doc);
          renderNav(filtered);
        };
        navEl.appendChild(btn);
      });
    });
  }

  function renderSearchResults(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
      return null;
    }

    const results = docs
      .map((doc) => {
        const text = `${doc.title} ${doc.summary} ${toText(doc.content)}`.toLowerCase();
        return {
          doc,
          score: (text.match(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length,
          matched: text.includes(q),
        };
      })
      .filter((x) => x.matched)
      .sort((a, b) => b.score - a.score);

    const resultsHtml = results.length
      ? `<ul>${results
          .slice(0, 15)
          .map(
            (r) =>
              `<li><a href="#${r.doc.slug}" data-slug="${r.doc.slug}">${r.doc.title}</a> <span class="small">- ${r.doc.summary}</span></li>`
          )
          .join("")}</ul>`
      : `<p class="small">No matching topics found.</p>`;

    return `
      <h1>Search</h1>
      <p class="lead">Results for <code>${query}</code></p>
      <div class="search-results">
        <h3>Matching topics</h3>
        ${resultsHtml}
      </div>
    `;
  }

  function renderDoc(doc) {
    if (!doc) {
      docEl.innerHTML = "<h1>Not found</h1><p class='lead'>The selected page does not exist.</p>";
      pagerEl.innerHTML = "";
      return;
    }
    docEl.innerHTML = doc.content;
    renderPager(doc.slug);
  }

  function renderPager(currentSlug) {
    const idx = docs.findIndex((d) => d.slug === currentSlug);
    if (idx === -1) {
      pagerEl.innerHTML = "";
      return;
    }
    const prev = idx > 0 ? docs[idx - 1] : null;
    const next = idx < docs.length - 1 ? docs[idx + 1] : null;

    const prevHtml = prev
      ? `<a href="#${prev.slug}"><div class="label">Previous</div><div class="title">${prev.title}</div></a>`
      : `<div></div>`;
    const nextHtml = next
      ? `<a class="right" href="#${next.slug}"><div class="label">Next</div><div class="title">${next.title}</div></a>`
      : `<div></div>`;

    pagerEl.innerHTML = `${prevHtml}${nextHtml}`;
  }

  function resolveFromHash() {
    const hash = location.hash.replace(/^#/, "").trim();
    if (!hash) return null;
    return bySlug.get(hash) || null;
  }

  function updateFromState() {
    const query = searchInput.value;
    const searchHtml = renderSearchResults(query);

    if (searchHtml) {
      docEl.innerHTML = searchHtml;
      pagerEl.innerHTML = "";
      renderNav(docs.filter((d) => {
        const text = `${d.title} ${d.summary} ${toText(d.content)}`.toLowerCase();
        return text.includes(query.trim().toLowerCase());
      }));
      docEl.querySelectorAll("a[data-slug]").forEach((a) => {
        a.addEventListener("click", () => {
          searchInput.value = "";
        });
      });
      return;
    }

    const fromHash = resolveFromHash();
    if (fromHash) {
      activeSlug = fromHash.slug;
      renderDoc(fromHash);
      renderNav(docs);
      return;
    }

    const first = docs[0] || null;
    if (first) {
      activeSlug = first.slug;
      renderDoc(first);
      renderNav(docs);
    }
  }

  searchInput.addEventListener("input", updateFromState);
  window.addEventListener("hashchange", updateFromState);

  updateFromState();
})();
