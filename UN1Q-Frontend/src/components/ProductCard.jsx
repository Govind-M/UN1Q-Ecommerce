import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import styles from "../styles/ProductCard.module.css";

import {
  toggleWishlist,
  selectIsWishlisted,
} from "../features/wishlist/wishlistSlice";

import { addToCart } from "../features/cart/cartSlice";

const PLACEHOLDER = "https://placehold.co/300x400/f0ede8/888?text=UN1Q";

const effectivePrice = (price, discount = "0%") => {
  return Math.round(price * (1 - parseInt(discount, 10) / 100));
};

const ProductCard = ({ product, categoryId, index, onClick }) => {
  if (product.status !== "active") return null;

  const dispatch = useDispatch();
  const isWishlisted = useSelector(selectIsWishlisted(product.id));
  const [imgSrc, setImgSrc] = useState(product.image);

  const variants = product.variants || [];
  const totalStock = variants.length > 0
    ? variants.reduce((sum, v) => sum + (v.available_stock ?? (v.stock_quantity - v.reserved_quantity)), 0)
    : 100;

  const isOutOfStock = totalStock === 0;
  const isLowStock = totalStock > 0 && totalStock <= 5;

  const handleWishlist = (e) => {
    e.stopPropagation();
    if (product.status !== "active") return;
    dispatch(toggleWishlist({ product, categoryId }));
  };

  const handleQuickAdd = (e) => {
    e.stopPropagation();

    if (product.status !== "active" || isOutOfStock) return;

    const sizes = Array.isArray(product.size) ? product.size : [product.size];

    if (sizes.length === 1) {
      dispatch(
        addToCart({
          product,
          categoryId,
          selectedSize: sizes[0],
          qty: 1,
        }),
      );
    } else {
      onClick(product.id);
    }
  };

  const discounted = effectivePrice(product.price, product.discount);
  const saved = product.price - discounted;
  const discPct = parseInt(product.discount ?? "0", 10);

  return (
    <div
      className={styles.card}
      style={{ animationDelay: `${index * 45}ms` }}
      onClick={() => {
        if (product.status !== "active") return;
        onClick(product.id);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" && product.status === "active") {
          onClick(product.id);
        }
      }}
      aria-label={product.name}
    >
      <div className={styles.imgWrap}>
        <img
          src={imgSrc}
          alt={product.name}
          className={styles.img}
          onError={() => setImgSrc(PLACEHOLDER)}
          loading="lazy"
        />

        {isOutOfStock ? (
          <span
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              background: "#dc2626",
              color: "#ffffff",
              fontSize: "9px",
              fontWeight: "800",
              letterSpacing: "1px",
              padding: "4px 8px",
              borderRadius: "3px",
              zIndex: 3,
            }}
          >
            OUT OF STOCK
          </span>
        ) : isLowStock ? (
          <span
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              background: "#d97706",
              color: "#ffffff",
              fontSize: "9px",
              fontWeight: "800",
              letterSpacing: "0.5px",
              padding: "4px 8px",
              borderRadius: "3px",
              zIndex: 3,
            }}
          >
            ONLY {totalStock} LEFT
          </span>
        ) : null}

        {product.fit && !isOutOfStock && <span className={styles.badgeFit}>{product.fit}</span>}

        {product.offer && (
          <span className={styles.badgeOffer}>{product.offer}</span>
        )}

        {discPct > 0 && (
          <span className={styles.badgeDisc}>{product.discount} OFF</span>
        )}

        <button
          className={`${styles.wishBtn} ${isWishlisted ? styles.wishBtnActive : ""}`}
          onClick={handleWishlist}
          aria-label="Toggle wishlist"
        >
          {isWishlisted ? "❤️" : "🤍"}
        </button>

        <div className={styles.quickAddOverlay}>
          <button
            className={styles.quickAddBtn}
            onClick={handleQuickAdd}
            disabled={product.status !== "active" || isOutOfStock}
            style={isOutOfStock ? { background: "#e2e8f0", color: "#94a3b8", cursor: "not-allowed" } : {}}
          >
            {isOutOfStock
              ? "Out of Stock"
              : Array.isArray(product.size) && product.size.length > 1
              ? "Select Size"
              : "+ Quick Add"}
          </button>
        </div>
      </div>

      <div className={styles.info}>
        <p className={styles.brand}>{product.brand}</p>
        <p className={styles.name}>{product.name}</p>
        {product.type && <p className={styles.type}>{product.type}</p>}

        <div className={styles.priceRow}>
          <span className={styles.priceNow}>
            ₹{discounted.toLocaleString("en-IN")}
          </span>
          {saved > 0 && (
            <>
              <span className={styles.priceMrp}>
                ₹{product.price.toLocaleString("en-IN")}
              </span>
              <span className={styles.discTag}>{product.discount} off</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
