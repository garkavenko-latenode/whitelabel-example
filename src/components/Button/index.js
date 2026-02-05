import React from "react";
import styles from "./index.module.css";

function Button({ onClick, children, className, ...restProps }) {
  return (
    <button className={[styles.button, className].join(' ')} onClick={onClick} {...restProps}>
      {children}
    </button>
  );
}

export default Button;

