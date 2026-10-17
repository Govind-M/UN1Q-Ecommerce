import { useRef, useEffect, useState } from "react";
import styles from "../styles/CategorySlider.module.css";

const CATEGORIES = ["MEN", "WOMEN"];

export default function CategorySlider({ active = "MEN", onChange }) {
  const containerRef = useRef(null);
  const sliderRef = useRef(null);
  const btnRefs = useRef({});

  useEffect(() => {
    const btn = btnRefs.current[active];
    const slider = sliderRef.current;
  
    if (!btn || !slider) return;


    slider.style.width = `${btn.width}px`;
    slider.style.transform = `translateX(${btn.offsetLeft}px)`;
  }, [active]);

  return (
    <div className={styles.catToggle}>
      <div className={styles.catSlider} ref={sliderRef} />
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          ref={(el) => { btnRefs.current[cat] = el; }}
          className={styles.catOption} 
          style={{ color: active === cat ? "#111" : "#9ca3af" }}
          onClick={() => onChange?.(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
