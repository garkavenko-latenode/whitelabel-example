import React from "react";
import styles from "./index.module.css";

function Tooltip({ title, children }) {
  return (
    <div className={styles.tooltip}>
      <>
        {children}
        {!!title && <div className={styles.container}>{title}</div>}
      </>
    </div>
  );
}

export default Tooltip;
