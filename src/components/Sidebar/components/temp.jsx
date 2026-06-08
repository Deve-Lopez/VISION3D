import styles from "../Sidebar.module.css";

export default function SceneConfigControls({ showGrid, setShowGrid, showWireframe, setShowWireframe, autoRotate, setAutoRotate, bgColor, setBgColor }) {
  return (
    <div className={styles.switchGroupMobile}>
      <label className={styles.controlRow}>
        <span>Rejilla</span>
        <button className={`${styles.toggle} ${showGrid ? styles.on : ""}`} onClick={() => setShowGrid(v => !v)}>
          <span className={styles.toggleKnob} />
        </button>
      </label>

      <label className={styles.controlRow}>
        <span>Malla</span>
        <button className={`${styles.toggle} ${showWireframe ? styles.on : ""}`} onClick={() => setShowWireframe(v => !v)}>
          <span className={styles.toggleKnob} />
        </button>
      </label>

      <label className={styles.controlRow}>
        <span>Giro</span>
        <button className={`${styles.toggle} ${autoRotate ? styles.on : ""}`} onClick={() => setAutoRotate(v => !v)}>
          <span className={styles.toggleKnob} />
        </button>
      </label>

      <label className={styles.controlRow}>
        <span>Color</span>
        <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className={styles.colorPick} />
      </label>
    </div>
  );
}