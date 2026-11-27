import styles from "./cyber.module.css";

/** Decorative CSS-only grid: no frame loop, canvas, wallet or network access. */
export function HoneycombBackground() {
  return (
    <div className={styles.background} aria-hidden="true" data-honeycomb>
      <div className={styles.haze} />
      <div className={styles.cells} />
      <div className={styles.energy}>
        <div className={styles.wave} />
        <div className={styles.pulse} />
      </div>
    </div>
  );
}
