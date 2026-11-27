"use client";

import { useState } from "react";
import { FiGlobe, FiMapPin, FiMinus, FiPlus, FiSearch } from "react-icons/fi";
import snapshot from "./data/orb-snapshot.json";
import geography from "./data/world-paths.json";
import styles from "./landing-main.module.css";

const shapes = [...geography.countries, { code: "SG", name: "Singapore", path: "" }].sort((a, b) => a.name.localeCompare(b.name));

export function WorldAvailability() {
  const [selected, setSelected] = useState("JP");
  const [zoom, setZoom] = useState(1);
  const country = shapes.find((item) => item.code === selected);
  const coverage = snapshot.countries.find((item) => item.code === selected);
  return (
    <section id="world-id" className={styles.worldSection} aria-labelledby="world-title">
      <div className={styles.wrap}>
        <div className={styles.mapHeading}>
          <div><p className={styles.kicker}><FiGlobe aria-hidden /> HUMAN VERIFICATION / GEOGRAPHIC ACCESS</p><h2 id="world-title">One world.<br /><span>Uneven access.</span></h2></div>
          <div><p>Proof of personhood starts in the real world. Getting an Orb-verified World ID may require visiting a physical location, and availability is not equal everywhere.</p><p><strong>BERT on Arc Testnet uses Demo verification, not World ID.</strong> You do not need an Orb to explore the site, use Console or test the current demo-access flow.</p></div>
        </div>
        <div className={styles.mapShell}>
          <div className={styles.mapToolbar}>
            <label><FiSearch aria-hidden /><span className={styles.srOnly}>Select a country</span><select aria-label="Select a country" value={selected} onChange={(event) => setSelected(event.target.value)}>{shapes.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
            <span className={styles.snapshotBadge}>SOURCE SNAPSHOT / {snapshot.checkedAt}</span>
          </div>
          <div className={styles.mapLayout}>
            <div className={styles.mapCanvas} tabIndex={0} aria-label="World map. Hover or select a country; use the country selector as a keyboard alternative.">
              <svg viewBox="0 0 1000 435" aria-label="Countries with locations listed in the official-source snapshot" style={{ width: `${zoom * 100}%` }}>
                <defs><pattern id="map-grid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" fill="none" stroke="#6473a8" strokeOpacity=".12" /></pattern></defs>
                <rect width="1000" height="435" fill="url(#map-grid)" />
                {geography.countries.map((item) => {
                  const known = snapshot.countries.some((country) => country.code === item.code);
                  return <path key={item.code} d={item.path} className={`${styles.country} ${known ? styles.covered : ""} ${selected === item.code ? styles.selectedCountry : ""}`} role="button" tabIndex={known ? 0 : -1} aria-label={`${item.name}: ${known ? "locations listed in this snapshot" : "coverage not established by this snapshot"}`} aria-pressed={selected === item.code} onMouseEnter={() => setSelected(item.code)} onFocus={() => setSelected(item.code)} onClick={() => setSelected(item.code)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(item.code); } }}><title>{item.name}</title></path>;
                })}
                <circle cx="788.5" cy="232.5" r="5" role="button" tabIndex={0} aria-label="Singapore: locations listed in this snapshot" aria-pressed={selected === "SG"} className={`${styles.country} ${styles.covered} ${selected === "SG" ? styles.selectedCountry : ""}`} onMouseEnter={() => setSelected("SG")} onFocus={() => setSelected("SG")} onClick={() => setSelected("SG")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected("SG"); } }} />
              </svg>
            </div>
            <div className={styles.countryPanel} aria-live="polite" aria-atomic="true">
              <div className={styles.countryPanelTop}><FiMapPin aria-hidden /><span>EXPLORE ACCESS</span></div>
              <h3>{country?.name ?? "Choose a country"}</h3>
              {coverage ? <>
                <p className={styles.locationCount}>{coverage.locations}<span>listed {coverage.locations === 1 ? "location" : "locations"}</span></p>
                <p className={styles.locationCaption}>In this source snapshot. Locations are not a count of Orb devices.</p>
                <div className={styles.cityList} tabIndex={0} aria-label={`Cities listed in ${coverage.name}`}>{coverage.cities.map((city) => <div key={city.name}><span>{city.name}</span><span>{city.locations}</span></div>)}</div>
              </> : <div className={styles.unknownCoverage}><FiGlobe aria-hidden /><p>Coverage not established</p><span>This country is not represented in our limited snapshot. That does not mean zero Orbs or that BERT is unavailable here.</span></div>}
              <a className={styles.mapLink} href={snapshot.source} target="_blank" rel="noreferrer">Check the official Orb locator <FiPlus aria-hidden /></a>
            </div>
          </div>
          <div className={styles.mapBottom}><div className={styles.mapLegend}><span><i />Listed location</span><span><i />Not established by snapshot</span></div><div className={styles.zoomControls}><button type="button" aria-label="Zoom out map" disabled={zoom === 1} onClick={() => setZoom(Math.max(1, zoom - .25))}><FiMinus /></button><button type="button" onClick={() => setZoom(1)} aria-label="Reset map zoom">{Math.round(zoom * 100)}%</button><button type="button" aria-label="Zoom in map" disabled={zoom === 2} onClick={() => setZoom(Math.min(2, zoom + .25))}><FiPlus /></button></div></div>
        </div>
        <div className={styles.mapNotes}><p><strong>{snapshot.locationCount} listed locations across {snapshot.countries.length} countries in this snapshot.</strong> This is not a complete global coverage dataset, live availability or a guarantee of eligibility. Confirm appointments and current requirements with World.</p><p>Map: <a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noreferrer">Natural Earth</a>. Source: <a href={snapshot.source} target="_blank" rel="noreferrer">World Orb locator</a>, checked {snapshot.checkedAt}. <a href="/testnet-information">Read BERT&apos;s current verification rules.</a></p></div>
      </div>
    </section>
  );
}
