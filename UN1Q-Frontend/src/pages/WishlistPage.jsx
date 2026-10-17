import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  selectWishlistItems,
  removeFromWishlist,
  clearWishlist,
} from "../features/wishlist/wishlistSlice";
import { addToCart, selectIsInCart } from "../features/cart/cartSlice";
import { setGender } from "../features/ui/uiSlice";
import Navbar from "../components/Navbar";
import styles from "../styles/WishlistPage.module.css";

const PLACEHOLDER = "https://placehold.co/120x160/f0ede8/888?text=UN1Q";

const effectivePrice = (price, discount = "0%") =>
  Math.round(price * (1 - parseInt(discount, 10) / 100));

const WishlistCard = ({ item, dispatch, navigate }) => {
  const finalPrice = effectivePrice(item.price, item.discount);
  const saved = item.price - finalPrice;

  const isInCart = useSelector(selectIsInCart(item.id, null));

  const handleMoveToCart = () => {
    navigate(`/products/${item.categoryId}/${item.id}`);
  };

  return (
    <div className={styles.card}>
      <img
        src={item.image}
        alt={item.name}
        className={styles.cardImg}
        onClick={() => navigate(`/products/${item.categoryId}/${item.id}`)}
        onError={(e) => (e.target.src = PLACEHOLDER)}
      />

      <div className={styles.cardBody}>
        <p className={styles.cardBrand}>{item.brand}</p>
        <p
          className={styles.cardName}
          onClick={() => navigate(`/products/${item.categoryId}/${item.id}`)}
        >
          {item.name}
        </p>

        <div className={styles.cardPriceRow}>
          <span className={styles.cardPrice}>
            ₹{finalPrice.toLocaleString("en-IN")}
          </span>
          {saved > 0 && (
            <>
              <span className={styles.cardMrp}>
                ₹{item.price.toLocaleString("en-IN")}
              </span>
              <span className={styles.cardDisc}>{item.discount} off</span>
            </>
          )}
        </div>

        <div className={styles.cardActions}>
          <button className={styles.addBtn} onClick={handleMoveToCart}>
            {isInCart ? "✓ In Cart" : "Add to Cart"}
          </button>
          <button
            className={styles.removeBtn}
            onClick={() => dispatch(removeFromWishlist(item.id))}
          >
            🗑 Remove
          </button>
        </div>
      </div>
    </div>
  );
};

const WishlistPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const wishlistItems = useSelector(selectWishlistItems);
  const activeGender = useSelector((state) => state.ui.activeGender);

  return (
    <>
      <Navbar
        activeCategory={activeGender}
        onCategoryChange={(c) => dispatch(setGender(c))}
      />

      <div className={styles.breadcrumb}>
        <span className={styles.crumbLink} onClick={() => navigate("/home")}>
          Home
        </span>
        <span className={styles.crumbSep}>/</span>
        <span className={styles.crumbCurrent}>Wishlist</span>
      </div>

      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>
            My Wishlist{" "}
            <span className={styles.count}>({wishlistItems.length} items)</span>
          </h1>
          {wishlistItems.length > 0 && (
            <button
              className={styles.clearBtn}
              onClick={() => dispatch(clearWishlist())}
            >
              Clear all
            </button>
          )}
        </div>

        {wishlistItems.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyIcon}>🤍</p>
            <p className={styles.emptyTitle}>Your wishlist is empty</p>
            <p className={styles.emptySubtitle}>
              Save items you love by tapping the heart icon.
            </p>
            <button
              className={styles.shopBtn}
              onClick={() => navigate("/home")}
            >
              Explore Collection
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {wishlistItems.map((item) => (
              <WishlistCard
                key={item.id}
                item={item}
                dispatch={dispatch}
                navigate={navigate}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default WishlistPage;
