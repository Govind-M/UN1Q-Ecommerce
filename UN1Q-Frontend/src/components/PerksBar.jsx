import styles from "../styles/PerksBar.module.css";
import React,{ Fragment } from "react";

const PERKS = [
  {
    id: "Discount",
    icon: "rupee",
    title: "Minimum 10% discount",
    subtitle: "on all orders",
  },
  {
    id: "returns",
    icon: "box",
    title: "30 days Easy Returns",
    subtitle: "& Exchanges",
  },
  {
    id: "shipping",
    icon: "truck",
    title: "Free & Fast Shipping",
    subtitle: "Guaranteed delivery",
  },
];

const Icon = ({ type }) => {
  if (type === "rupee") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={styles.icon}>
        <text
          x="12"
          y="17"
          textAnchor="middle"
          fontSize="16"
          fontWeight="700"
          fill="currentColor"
          fontFamily="sans-serif"
        >
          ₹
        </text>
      </svg>
    );
  }
  if (type === "box") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={styles.icon}
      >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    );
  }
  if (type === "truck") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={styles.icon}
      >
        <rect x="1" y="3" width="15" height="13" rx="1" />
        <path d="M16 8h4l3 5v3h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    );
  }
  return null;
};

const PerksBar = () => (
  <div className={styles.wrap}>
    <div className={styles.bar}>
      {PERKS.map((perk, i) => (
        <React.Fragment key={perk.id}>
          <div  className={styles.perk}>
            <div className={styles.iconWrap}>
              <Icon type={perk.icon} />
            </div>
            <div className={styles.text}>
              <p className={styles.title}>{perk.title}</p>
              <p className={styles.subtitle}>{perk.subtitle}</p>
            </div>
          </div>
          {i < PERKS.length - 1 && (
            <div key={`divider-${i}`} className={styles.divider} />
          )}
        </React.Fragment>
      ))}
    </div>
  </div>
);

export default PerksBar;
