import { useDispatch, useSelector } from "react-redux";
import { setCategory } from "../features/ui/uiSlice";
import { CATEGORIES } from "../services/categoryApi";
import CategoryCard from "./CategoryCard";
import styles from "../styles/CategoriesSection.module.css";
import { useNavigate } from "react-router-dom";

const CategoriesSection = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const activeGender = useSelector((state) => state.ui.activeGender);

  const handleCategoryClick = (categoryId) => {
    dispatch(setCategory({ categoryId, gender: activeGender }));
    navigate(`/products/${categoryId}`);
  };

  const genderKey = activeGender === "MEN" ? "men" : "women";

  const filteredCats = CATEGORIES.filter(
    (c) => c.gender === genderKey || c.gender === "unisex",
  );

  const mainCats = filteredCats.filter((c) => c.gender === genderKey);
  const accessoryCats = filteredCats.filter((c) => c.gender === "unisex");

  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>CATEGORIES</h2>
        <span className={styles.sectionRule} />
      </div>

      <div className={styles.genderBlock}>
        <p className={styles.genderLabel}>{activeGender}</p>
        <div className={styles.grid}>
          {mainCats.map((cat, i) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              index={i}
              onClick={handleCategoryClick}
            />
          ))}
        </div>
      </div>

      {accessoryCats.length > 0 && (
        <div className={styles.genderBlock}>
          <p className={styles.genderLabel}>ACCESSORIES</p>
          <div className={`${styles.grid} ${styles.gridAccessory}`}>
            {accessoryCats.map((cat, i) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                index={i}
                onClick={handleCategoryClick}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default CategoriesSection;
