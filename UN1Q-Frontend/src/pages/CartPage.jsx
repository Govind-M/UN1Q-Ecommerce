import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  selectCartItems,
  selectCartTotal,
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
  clearCart,
  validateCouponAsync,
  removeCoupon,
  selectAppliedCoupon,
  selectCouponError,
  selectCouponDiscount,
  selectCouponStatus,
} from "../features/cart/cartSlice";
import {
  toggleWishlist,
  selectIsWishlisted,
} from "../features/wishlist/wishlistSlice";
import { setGender } from "../features/ui/uiSlice";
import Navbar from "../components/Navbar";
import styles from "../styles/CartPage.module.css";

const PLACEHOLDER = "https://placehold.co/120x160/f0ede8/888?text=UN1Q";

const effectivePrice = (price, discount = "0%") =>
  Math.round(price * (1 - parseInt(discount, 10) / 100));

const CartItem = ({ item, dispatch, navigate }) => {
  const isWishlisted = useSelector(selectIsWishlisted(item.id));
  const finalPrice = effectivePrice(item.price, item.discount);
  const saved = item.price - finalPrice;

  return (
    <div className={styles.item}>
      <img
        src={item.image}
        alt={item.name}
        className={styles.itemImg}
        onClick={() => navigate(`/products/${item.categoryId}/${item.id}`)}
        onError={(e) => (e.target.src = PLACEHOLDER)}
      />

      <div className={styles.itemDetails}>
        <p className={styles.itemBrand}>{item.brand}</p>
        <p
          className={styles.itemName}
          onClick={() => navigate(`/products/${item.categoryId}/${item.id}`)}
        >
          {item.name}
        </p>

        {item.selectedSize && (
          <p className={styles.itemMeta}>Size: {item.selectedSize}</p>
        )}

        <div className={styles.itemPriceRow}>
          <span className={styles.itemPrice}>
            ₹{finalPrice.toLocaleString("en-IN")}
          </span>
          {saved > 0 && (
            <>
              <span className={styles.itemMrp}>
                ₹{item.price.toLocaleString("en-IN")}
              </span>
              <span className={styles.itemSave}>{item.discount} off</span>
            </>
          )}
        </div>

        <div className={styles.qtyRow}>
          <button
            className={styles.qtyBtn}
            onClick={() =>
              dispatch(
                decreaseQuantity({
                  id: item.id,
                  selectedSize: item.selectedSize,
                }),
              )
            }
          >
            −
          </button>
          <span className={styles.qtyVal}>{item.quantity}</span>
          <button
            className={styles.qtyBtn}
            onClick={() =>
              dispatch(
                increaseQuantity({
                  id: item.id,
                  selectedSize: item.selectedSize,
                }),
              )
            }
          >
            +
          </button>
        </div>

        <div className={styles.itemActions}>
          <button
            className={styles.actionBtn}
            onClick={() =>
              dispatch(
                removeFromCart({
                  id: item.id,
                  selectedSize: item.selectedSize,
                }),
              )
            }
          >
            🗑 Remove
          </button>
          <button
            className={`${styles.actionBtn} ${isWishlisted ? styles.actionBtnActive : ""}`}
            onClick={() =>
              dispatch(
                toggleWishlist({
                  product: {
                    id: item.id,
                    name: item.name,
                    brand: item.brand,
                    price: item.price,
                    discount: item.discount,
                    image: item.image,
                  },
                  categoryId: item.categoryId,
                }),
              )
            }
          >
            {isWishlisted ? "❤️ Wishlisted" : "🤍 Move to Wishlist"}
          </button>
        </div>
      </div>

      <div className={styles.lineTotal}>
        ₹{(finalPrice * item.quantity).toLocaleString("en-IN")}
      </div>
    </div>
  );
};

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState("");

  const cartItems = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const activeGender = useSelector((state) => state.ui.activeGender);

  const appliedCoupon = useSelector(selectAppliedCoupon);
  const couponError = useSelector(selectCouponError);
  const couponStatus = useSelector(selectCouponStatus);
  const couponDiscount = useSelector(selectCouponDiscount);

  const discountedSubtotal = Math.max(0, total - couponDiscount);
  const deliveryFee = discountedSubtotal >= 999 || discountedSubtotal === 0 ? 0 : 99;
  const grandTotal = discountedSubtotal + deliveryFee;

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (couponCode.trim()) {
      dispatch(validateCouponAsync(couponCode));
      setCouponCode("");
    }
  };

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
        <span className={styles.crumbCurrent}>Cart</span>
      </div>

      <div className={styles.layout}>
        <div className={styles.left}>
          <div className={styles.listHeader}>
            <h1 className={styles.title}>
              My Cart{" "}
              <span className={styles.count}>({cartItems.length} items)</span>
            </h1>
            {cartItems.length > 0 && (
              <button
                className={styles.clearBtn}
                onClick={() => dispatch(clearCart())}
              >
                Clear all
              </button>
            )}
          </div>

          {cartItems.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyIcon}>🛒</p>
              <p className={styles.emptyTitle}>Your cart is empty</p>
              <p className={styles.emptySubtitle}>
                Looks like you haven't added anything yet.
              </p>
              <button
                className={styles.shopBtn}
                onClick={() => navigate("/home")}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className={styles.itemList}>
              {cartItems.map((item) => (
                <CartItem
                  key={`${item.id}-${item.selectedSize}`}
                  item={item}
                  dispatch={dispatch}
                  navigate={navigate}
                />
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className={styles.summary}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>

            <div className={styles.couponBox}>
              <p className={styles.couponLabel}>Have a Promo Code?</p>
              {appliedCoupon ? (
                <div className={styles.appliedCouponPill}>
                  <span>🎉 <strong>{appliedCoupon.code}</strong> applied</span>
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
                    placeholder="e.g. UN1Q10, UN1Q20"
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

            <div className={styles.divider} />

            <div className={styles.summaryRow}>
              <span>
                Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)
              </span>
              <span>₹{total.toLocaleString("en-IN")}</span>
            </div>

            {couponDiscount > 0 && (
              <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                <span>Coupon Discount ({appliedCoupon?.code})</span>
                <span>- ₹{couponDiscount.toLocaleString("en-IN")}</span>
              </div>
            )}

            <div className={styles.summaryRow}>
              <span>Delivery</span>
              <span className={deliveryFee === 0 ? styles.free : ""}>
                {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
              </span>
            </div>

            {deliveryFee > 0 && (
              <p className={styles.deliveryNote}>
                Add ₹{(999 - discountedSubtotal).toLocaleString("en-IN")} more for free
                delivery
              </p>
            )}

            <div className={styles.divider} />

            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <span>Total</span>
              <span>₹{grandTotal.toLocaleString("en-IN")}</span>
            </div>

            <button
              className={styles.checkoutBtn}
              onClick={() => navigate("/checkout")}
            >
              Proceed to Checkout
            </button>

            <button
              className={styles.continueBtn}
              onClick={() => navigate("/home")}
            >
              ← Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartPage;
