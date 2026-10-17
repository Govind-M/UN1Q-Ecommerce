import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectCartItems,
  selectCartTotal,
  selectAppliedCoupon,
  selectCouponDiscount,
  selectCouponError,
  selectCouponStatus,
  validateCouponAsync,
  removeCoupon,
} from "../../features/cart/cartSlice";
import { selectShippingCost } from "../../features/checkout/checkoutSlice";
import styles from "../../styles/CheckoutPage.module.css";

const PLACEHOLDER = "https://placehold.co/64x80/f0ede8/888?text=UN1Q";

const effectivePrice = (price, discount = "0%") =>
  Math.round(price * (1 - parseInt(discount, 10) / 100));

const OrderSummary = ({ onPlace, isLoading }) => {
  const dispatch = useDispatch();

  const [couponCode, setCouponCode] = useState("");

  const cartItems      = useSelector(selectCartItems);
  const subtotal       = useSelector(selectCartTotal);
  const appliedCoupon  = useSelector(selectAppliedCoupon);
  const couponDiscount = useSelector(selectCouponDiscount);
  const couponError    = useSelector(selectCouponError);
  const couponStatus   = useSelector(selectCouponStatus);
  const shipping       = useSelector(selectShippingCost);

  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
  const tax                = Math.round(discountedSubtotal * 0.08); // 8% tax
  const total              = discountedSubtotal + shipping + tax;

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (couponCode.trim()) {
      dispatch(validateCouponAsync(couponCode));
      setCouponCode("");
    }
  };

  return (
    <aside className={styles.summary}>
      <h2 className={styles.summaryTitle}>Order Summary</h2>

      <div className={styles.summaryItems}>
        {cartItems.map((item) => {
          const finalPrice = effectivePrice(item.price, item.discount);
          return (
            <div
              key={`${item.id}-${item.selectedSize}`}
              className={styles.summaryItem}
            >
              <img
                src={item.image}
                alt={item.name}
                className={styles.summaryItemImg}
                onError={(e) => (e.target.src = PLACEHOLDER)}
              />
              <div className={styles.summaryItemInfo}>
                <p className={styles.summaryItemName}>{item.name}</p>
                <p className={styles.summaryItemMeta}>
                  {item.selectedSize && `Size: ${item.selectedSize}`}
                  {item.selectedSize && item.quantity > 1 && "  ·  "}
                  {item.quantity > 1 && `Qty: ${item.quantity}`}
                </p>
                <p className={styles.summaryItemPrice}>
                  ₹{(finalPrice * item.quantity).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Coupon Section */}
      <div className={styles.couponBox}>
        <p className={styles.couponLabel}>Promo Code</p>
        {appliedCoupon ? (
          <div className={styles.appliedCouponPill}>
            <span>🎉 <strong>{appliedCoupon.code}</strong></span>
            <button
              onClick={() => dispatch(removeCoupon())}
              className={styles.removeCouponBtn}
            >
              Remove
            </button>
          </div>
        ) : (
          <form onSubmit={handleApplyCoupon} className={styles.couponForm}>
            <input
              type="text"
              placeholder="Promo Code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className={styles.couponInput}
            />
            <button
              type="submit"
              className={styles.applyCouponBtn}
              disabled={couponStatus === "loading"}
            >
              {couponStatus === "loading" ? "..." : "Apply"}
            </button>
          </form>
        )}
        {couponError && (
          <p className={styles.couponErrorText}>{couponError}</p>
        )}
      </div>

      <div className={styles.summaryDivider} />

      <div className={styles.summaryRow}>
        <span>Subtotal</span>
        <span>₹{subtotal.toLocaleString("en-IN")}</span>
      </div>

      {couponDiscount > 0 && (
        <div className={`${styles.summaryRow} ${styles.discountRow}`}>
          <span>Discount ({appliedCoupon?.code})</span>
          <span>- ₹{couponDiscount.toLocaleString("en-IN")}</span>
        </div>
      )}

      <div className={styles.summaryRow}>
        <span>Shipping</span>
        <span className={shipping === 0 ? styles.free : ""}>
          {shipping === 0 ? "Free" : `₹${shipping}`}
        </span>
      </div>

      <div className={styles.summaryRow}>
        <span>Estimated Tax</span>
        <span>₹{tax.toLocaleString("en-IN")}</span>
      </div>

      <div className={styles.summaryDivider} />

      <div className={`${styles.summaryRow} ${styles.totalRow}`}>
        <span>Total</span>
        <span>₹{total.toLocaleString("en-IN")}</span>
      </div>

      <button
        className={styles.placeOrderBtn}
        onClick={onPlace}
        disabled={isLoading}
      >
        {isLoading ? "Processing…" : "Complete Purchase →"}
      </button>

      <p className={styles.secureNote}>
        By completing your purchase you agree to our Terms of Service and
        Privacy Policy. Secure 256-bit SSL encrypted payment.
      </p>
    </aside>
  );
};

export default OrderSummary;