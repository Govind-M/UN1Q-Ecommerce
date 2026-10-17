import { useState } from "react";
import styles from "../styles/CategoriesSection.module.css";

const PLACEHOLDER = "https://placehold.co/600x800/f0ede8/888?text=UN1Q";

const CategoryCard = ({ category, index, onClick }) => {
  const [imgSrc, setImgSrc] = useState(category.image);

  return (
    <div
      className={styles.card}
      style={{ animationDelay: `${index * 70}ms` }}
      onClick={() => onClick(category.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick(category.id)}
      aria-label={`Browse ${category.label}`}
    >
      <img
        src={imgSrc}
        alt={category.label}
        className={styles.cardImg}
        onError={() => setImgSrc(PLACEHOLDER)}
        loading="lazy"
      />

      <div className={styles.cardOverlay} />

      <div className={styles.cardBody}>
        <p className={styles.cardName}>{category.label}</p>

        <span className={styles.cardCta}>
          SHOP NOW
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
            <path
              d="M1 5h12M8 1l5 4-5 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </div>
  );
};

export default CategoryCard;