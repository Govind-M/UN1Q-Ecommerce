import { useState } from "react";
import styles from "../styles/ProductDetailPage.module.css"

function Accordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={styles.accordion}>
      <button
        className={styles.accordionBtn}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{title}</span>
        <span className={styles.accordionIcon}>{open ? "−" : "+"}</span>
      </button>
      {open && <div className={styles.accordionBody}>{children}</div>}
    </div>
  );
}

export default Accordion;
