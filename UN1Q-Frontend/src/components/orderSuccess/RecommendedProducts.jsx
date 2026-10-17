import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loadAllProducts } from "../../features/products/productsSlice";
import styles from "../../styles/OrderSuccessPage.module.css";

const PLACEHOLDER = "https://placehold.co/300x400/f0ede8/888?text=UN1Q";

const effectivePrice = (price, discount = "0%") =>
  Math.round(price * (1 - parseInt(discount, 10) / 100));


const RecommendedProducts = ({ categoryId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items, listingStatus } = useSelector((state) => state.products);

  useEffect(() => {
    if (categoryId) {
      dispatch(loadAllProducts(categoryId));
    }
  }, [dispatch, categoryId]);

  if (listingStatus === "loading") {
    return (
      <div className={styles.recLoading}>
        <div className={styles.recSpinner} />
      </div>
    );
  }

  const recommendations = items.slice(0, 4);

  if (!recommendations.length) return null;

  return (
    <section className={styles.recSection}>
      <p className={styles.recEyebrow}>CURATED FOR YOU</p>
      <h2 className={styles.recTitle}>You might also like</h2>

      <div className={styles.recGrid}>
        {recommendations.map((product) => {
          const discounted = effectivePrice(product.price, product.discount);

          return (
            <div
              key={product.id}
              className={styles.recCard}
              onClick={() =>
                navigate(`/products/${categoryId}/${product.id}`)
              }
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                navigate(`/products/${categoryId}/${product.id}`)
              }
            >
              <div className={styles.recImgWrap}>
                <img
                  src={product.image}
                  alt={product.name}
                  className={styles.recImg}
                  onError={(e) => (e.target.src = PLACEHOLDER)}
                  loading="lazy"
                />
              </div>
              <div className={styles.recInfo}>
                <p className={styles.recName}>{product.name}</p>
                <p className={styles.recPrice}>
                  ₹{discounted.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default RecommendedProducts;