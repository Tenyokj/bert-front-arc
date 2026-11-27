"use client";

import { useDeferredValue, useId, useState, useSyncExternalStore, type ReactNode } from "react";
import styles from "./collection.module.css";

const subscribe = () => () => {};

export function CollectionFilter<T extends { id: number }>({ items, getTitle, getStatus, renderItem }: {
  items: readonly T[]; getTitle: (item: T) => string; getStatus: (item: T) => string; renderItem: (item: T) => ReactNode;
}) {
  const id = useId();
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("loaded");
  const deferred = useDeferredValue(search.trim().toLowerCase());
  const statuses = [...new Set(items.map(getStatus))];
  const filtered = items.filter((item) => (!status || getStatus(item) === status) && `${item.id} ${getTitle(item)}`.toLowerCase().includes(deferred));
  if (sort === "title") filtered.sort((a, b) => getTitle(a).localeCompare(getTitle(b)));
  if (sort === "newest") filtered.sort((a, b) => b.id - a.id);
  return <div className={styles.collection} data-collection-ready={hydrated}>
    <fieldset disabled={!hydrated} className={styles.toolbar}>
      <label htmlFor={`${id}-search`}>Find on this page<input id={`${id}-search`} type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Title or ID" /></label>
      <label htmlFor={`${id}-status`}>Status<select aria-label="Filter by status" id={`${id}-status`} value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All loaded statuses</option>{statuses.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <label htmlFor={`${id}-sort`}>Order<select id={`${id}-sort`} value={sort} onChange={(event) => setSort(event.target.value)}><option value="loaded">As loaded</option><option value="newest">Highest ID first</option><option value="title">Title A-Z</option></select></label>
      <button type="button" onClick={() => { setSearch(""); setStatus(""); setSort("loaded"); }}>Reset filters</button>
    </fieldset>
    <p className={styles.scope} role="status">{filtered.length} of {items.length} loaded records shown. Filters apply to this page only; use pagination for other records.</p>
    {filtered.length ? <div className={styles.grid}>{filtered.map(renderItem)}</div> : <div className={styles.empty}>No matching records on this page. Clear the filters or open another page.</div>}
  </div>;
}
