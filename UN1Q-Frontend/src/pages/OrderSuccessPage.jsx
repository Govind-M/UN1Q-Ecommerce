import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  resetCheckout,
  selectOrderSnapshot,
} from "../features/checkout/checkoutSlice";
import { setGender } from "../features/ui/uiSlice";
import Navbar from "../components/Navbar";
import RecommendedProducts from "../components/orderSuccess/RecommendedProducts";
import styles from "../styles/OrderSuccessPage.module.css";

const PLACEHOLDER = "https://placehold.co/80x100/f0ede8/888?text=UN1Q";

const effectivePrice = (price, discount = "0%") =>
  Math.round(price * (1 - parseInt(discount, 10) / 100));

const formatDate = (isoString) => {
  if (!isoString) return "";
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const estimatedDelivery = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  date.setDate(date.getDate() + 5);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const OrderSuccessPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const snapshot = useSelector(selectOrderSnapshot);
  const activeGender = useSelector((state) => state.ui.activeGender);

  useEffect(() => {
    if (!snapshot) {
      navigate("/home", { replace: true });
    }
  }, [snapshot, navigate]);

  if (!snapshot) return null;

  const { items, subtotal, shipping, tax, total, orderId, placedAt } = snapshot;

  const recommendationCategoryId = items[0]?.categoryId ?? null;

  const handleContinueShopping = () => {
    dispatch(resetCheckout());
    navigate("/home");
  };

  return (
    <>
      <Navbar
        activeCategory={activeGender}
        onCategoryChange={(c) => dispatch(setGender(c))}
      />

      <div className={styles.page}>
        <div className={styles.hero}>
          <div className={styles.checkCircle}>
            <svg viewBox="0 0 24 24" fill="none" className={styles.checkIcon}>
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 className={styles.heroTitle}>Thank You</h1>
          <p className={styles.heroSub}>
            Your order is being curated with the precision of a masterpiece.
            <br />
            Welcome to the UN1Q collection.
          </p>

          <div className={styles.metaRow}>
            <div className={styles.metaItem}>
              <p className={styles.metaLabel}>ORDER CONFIRMED</p>
              <p className={styles.metaValue}>#{orderId}</p>
            </div>
            <div className={styles.metaDivider} />
            <div className={styles.metaItem}>
              <p className={styles.metaLabel}>ESTIMATED DELIVERY</p>
              <p className={styles.metaValue}>{estimatedDelivery(placedAt)}</p>
            </div>
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.orderCard}>
            <h2 className={styles.cardTitle}>Order Summary</h2>

            <div className={styles.itemList}>
              {items.map((item) => {
                const finalPrice = effectivePrice(item.price, item.discount);
                return (
                  <div
                    key={`${item.id}-${item.selectedSize}`}
                    className={styles.itemRow}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className={styles.itemImg}
                      onError={(e) => (e.target.src = PLACEHOLDER)}
                    />
                    <div className={styles.itemInfo}>
                      <p className={styles.itemName}>{item.name}</p>
                      <p className={styles.itemMeta}>
                        {item.selectedSize && `Size: ${item.selectedSize}`}
                        {item.selectedSize && item.quantity > 1 && "  ·  "}
                        {item.quantity > 1 && `Qty: ${item.quantity}`}
                      </p>
                      <p className={styles.itemPrice}>
                        ₹{(finalPrice * item.quantity).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.cardDivider} />

            <div className={styles.priceRow}>
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className={styles.priceRow}>
              <span>Shipping</span>
              <span className={shipping === 0 ? styles.free : ""}>
                {shipping === 0 ? "Complimentary" : `₹${shipping}`}
              </span>
            </div>
            {tax > 0 && (
              <div className={styles.priceRow}>
                <span>Tax</span>
                <span>₹{tax.toLocaleString("en-IN")}</span>
              </div>
            )}

            <div className={styles.cardDivider} />

            <div className={`${styles.priceRow} ${styles.totalRow}`}>
              <span>Total</span>
              <span>₹{total.toLocaleString("en-IN")}</span>
            </div>

            <button
              className={styles.continueBtn}
              onClick={handleContinueShopping}
            >
              Continue Shopping
            </button>
          </div>
        </div>

        {recommendationCategoryId && (
          <RecommendedProducts categoryId={recommendationCategoryId} />
        )}
      </div>
    </>
  );
};

export default OrderSuccessPage;
