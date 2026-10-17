import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  loadSingleProduct,
  clearActiveProduct,
} from "../features/products/productsSlice";

import { setGender } from "../features/ui/uiSlice";

import { CATEGORIES } from "../services/categoryApi";
import Navbar from "../components/Navbar";
import styles from "../styles/ProductDetailPage.module.css";
import Accordion from "../components/Accordion";

import { addToCart, selectIsInCart } from "../features/cart/cartSlice";
import {
  toggleWishlist,
  selectIsWishlisted,
} from "../features/wishlist/wishlistSlice";

const PLACEHOLDER = "https://placehold.co/600x800/f0ede8/888?text=UN1Q";

const effectivePrice = (price, discount = "0%") =>
  Math.round(price * (1 - parseInt(discount, 10) / 100));

const ProductDetailPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { categoryId, productId } = useParams();
  const user = useSelector((state) => state.auth.user);

  const product = useSelector((state) => state.products.activeProduct);
  const status = useSelector((state) => state.products.detailStatus);
  const error = useSelector((state) => state.products.detailError);
  const activeGender = useSelector((state) => state.ui.activeGender);

  const isWishlisted = useSelector(selectIsWishlisted(product?.id));

  const categoryMeta = CATEGORIES.find((c) => c.id === categoryId);

  useEffect(() => {
    if (categoryId && productId) {
      dispatch(loadSingleProduct({ categoryId, productId }));
    }
    return () => {
      dispatch(clearActiveProduct());
    };
  }, [dispatch, categoryId, productId]);

  const [selectedSize, setSelectedSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [imgSrc, setImgSrc] = useState(null);
  const [toast, setToast] = useState(null);

  const isInCart = useSelector(selectIsInCart(product?.id, selectedSize));

  useEffect(() => {
    setSelectedSize(null);
    setQty(1);
    setSizeError(false);
    setImgSrc(null);
  }, [productId]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const discPct = parseInt(product?.discount ?? "0", 10);
  const finalPrice = product
    ? effectivePrice(product.price, product.discount)
    : 0;
  const saved = product ? product.price - finalPrice : 0;

  const sizes = product
    ? Array.isArray(product.size)
      ? product.size
      : [product.size]
    : [];

  const variants = product?.variants || [];

  const getVariantForSize = (s) => {
    return variants.find((v) => String(v.size).toUpperCase() === String(s).toUpperCase());
  };

  const getAvailableStockForSize = (s) => {
    const v = getVariantForSize(s);
    if (!v) return 100;
    return v.available_stock ?? Math.max(0, v.stock_quantity - v.reserved_quantity);
  };

  const currentVariantStock = selectedSize ? getAvailableStockForSize(selectedSize) : null;
  const isCurrentVariantOutOfStock = currentVariantStock === 0;

  const handleAddToCart = () => {
    if (!user) {
      navigate("/login", {
        state: { from: { pathname: `/products/${categoryId}/${productId}` } },
      });
      return;
    }
    if (sizes.length > 0 && !selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 2000);
      return;
    }

    if (isCurrentVariantOutOfStock) {
      showToast("Selected size is currently out of stock.");
      return;
    }

    dispatch(addToCart({ product, categoryId, selectedSize, qty }));
    showToast("Added to cart! 🛒");
  };

  const handleCartAction = () => {
    if (isInCart) {
      navigate("/cart");
    } else {
      handleAddToCart();
    }
  };

  const handleWishlist = () => {
    dispatch(toggleWishlist({ product, categoryId }));
  };

  const Breadcrumb = () => (
    <div className={styles.breadcrumb}>
      <span className={styles.crumbLink} onClick={() => navigate("/home")}>
        Home
      </span>
      <span className={styles.crumbSep}>/</span>
      <span
        className={styles.crumbLink}
        onClick={() => navigate(`/products/${categoryId}`)}
      >
        {categoryMeta?.label ?? categoryId}
      </span>
      <span className={styles.crumbSep}>/</span>
      <span className={styles.crumbCurrent}>{product?.name ?? "Product"}</span>
    </div>
  );

  if (status === "loading")
    return (
      <>
        <Navbar
          activeCategory={activeGender}
          onCategoryChange={(c) => dispatch(setGender(c))}
        />
        <Breadcrumb />
        <div className={styles.stateWrap}>
          <div className={styles.spinner} />
          <p>Loading product…</p>
        </div>
      </>
    );

  if (status === "failed")
    return (
      <>
        <Navbar
          activeCategory={activeGender}
          onCategoryChange={(c) => dispatch(setGender(c))}
        />
        <Breadcrumb />
        <div className={styles.stateWrap}>
          <p className={styles.errorText}>⚠ {error ?? "Product not found."}</p>
          <button
            className={styles.backBtn}
            onClick={() => navigate(`/products/${categoryId}`)}
          >
            ← Back to listing
          </button>
        </div>
      </>
    );

  if (!product) return null;

  return (
    <>
      <Navbar
        activeCategory={activeGender}
        onCategoryChange={(c) => dispatch(setGender(c))}
        onSearch={(val) => console.log("search:", val)}
      />

      <Breadcrumb />

      <div className={styles.layout}>
        <div className={styles.imagePanel}>
          <div className={styles.mainImgWrap}>
            <img
              src={imgSrc ?? product.image}
              alt={product.name}
              className={styles.mainImg}
              onError={() => setImgSrc(PLACEHOLDER)}
            />
            {discPct > 0 && (
              <span className={styles.discLabel}>{discPct}% OFF</span>
            )}
          </div>

          <div className={styles.thumbRail}>
            {[product.image, product.image].map((img, i) => (
              <img
                key={`thumb-${i}-${img}`}
                src={img}
                alt={`${product.name} view ${i + 1}`}
                className={styles.thumb}
                onClick={() => setImgSrc(img)}
                onError={(e) => (e.target.src = PLACEHOLDER)}
              />
            ))}
          </div>
        </div>

        <div className={styles.infoPanel}>
          <div className={styles.badgeRow}>
            <span className={styles.brandBadge}>{product.brand}</span>
            {product.fit && (
              <span className={styles.fitBadge}>{product.fit}</span>
            )}
            {product.type && (
              <span className={styles.typeBadge}>{product.type}</span>
            )}
          </div>

          <h1 className={styles.productName}>{product.name}</h1>

          <div className={styles.priceBlock}>
            <span className={styles.priceNow}>
              ₹{finalPrice.toLocaleString("en-IN")}
            </span>
            {saved > 0 && (
              <>
                <span className={styles.priceMrp}>
                  ₹{product.price.toLocaleString("en-IN")}
                </span>
                <span className={styles.priceSave}>
                  You save ₹{saved.toLocaleString("en-IN")}
                </span>
              </>
            )}
          </div>
          <p className={styles.taxNote}>Inclusive of all taxes</p>

          <div className={styles.divider} />

          {product.offer && (
            <div className={styles.offerTag}>🏷 {product.offer}</div>
          )}

          {product.color && (
            <div className={styles.attrRow}>
              <span className={styles.attrLabel}>COLOUR</span>
              <span className={styles.attrVal}>{product.color}</span>
            </div>
          )}
          {product.sleeve && (
            <div className={styles.attrRow}>
              <span className={styles.attrLabel}>SLEEVE</span>
              <span className={styles.attrVal}>{product.sleeve}</span>
            </div>
          )}

          {sizes.length > 0 && (
            <div className={styles.sizeSection}>
              <div className={styles.sizeLabelRow}>
                <span className={styles.attrLabel}>SELECT SIZE</span>
                <button className={styles.sizeGuide}>Size Guide →</button>
              </div>
              <div
                className={`${styles.sizeGrid} ${sizeError ? styles.sizeError : ""}`}
              >
                {sizes.map((s) => {
                  const sizeStock = getAvailableStockForSize(s);
                  const isSizeOOS = sizeStock === 0;

                  return (
                    <button
                      key={s}
                      disabled={isSizeOOS}
                      className={`${styles.sizeBtn} ${selectedSize === s ? styles.sizeBtnActive : ""}`}
                      style={
                        isSizeOOS
                          ? {
                              textDecoration: "line-through",
                              color: "#cbd5e1",
                              borderColor: "#e2e8f0",
                              background: "#f8fafc",
                              cursor: "not-allowed",
                            }
                          : {}
                      }
                      onClick={() => {
                        setSelectedSize(s);
                        setQty(1);
                        setSizeError(false);
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>

              {selectedSize && (
                <div style={{ marginTop: "10px", fontSize: "12px", fontWeight: "600" }}>
                  {isCurrentVariantOutOfStock ? (
                    <span style={{ color: "#dc2626" }}>❌ Size {selectedSize} is currently Out of Stock</span>
                  ) : currentVariantStock <= 5 ? (
                    <span style={{ color: "#d97706" }}>
                      ⚠️ Only {currentVariantStock} left in stock — order soon!
                    </span>
                  ) : (
                    <span style={{ color: "#16a34a" }}>✓ In Stock</span>
                  )}
                </div>
              )}

              {sizeError && (
                <p className={styles.sizeHint}>⚠ Please select a size</p>
              )}
            </div>
          )}

          <div className={styles.qtySection}>
            <span className={styles.attrLabel}>QUANTITY</span>
            <div className={styles.qtyControl}>
              <button
                className={styles.qtyBtn}
                disabled={isCurrentVariantOutOfStock}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span className={styles.qtyVal}>{isCurrentVariantOutOfStock ? 0 : qty}</span>
              <button
                className={styles.qtyBtn}
                disabled={
                  isCurrentVariantOutOfStock ||
                  (currentVariantStock !== null && qty >= Math.min(currentVariantStock, 10))
                }
                onClick={() => {
                  const maxCap = currentVariantStock ? Math.min(currentVariantStock, 10) : 10;
                  setQty((q) => Math.min(maxCap, q + 1));
                }}
              >
                +
              </button>
            </div>
            {currentVariantStock !== null && currentVariantStock > 0 && (
              <span style={{ fontSize: "11px", color: "#64748b" }}>
                (Max available: {currentVariantStock})
              </span>
            )}
          </div>

          <div className={styles.ctaRow}>
            <button
              className={`${styles.btnCart} ${isInCart ? styles.btnCartActive : ""}`}
              onClick={handleCartAction}
              disabled={isCurrentVariantOutOfStock}
              style={
                isCurrentVariantOutOfStock
                  ? { background: "#e2e8f0", color: "#94a3b8", cursor: "not-allowed" }
                  : {}
              }
            >
              {isCurrentVariantOutOfStock
                ? "OUT OF STOCK"
                : isInCart
                ? "GO TO CART"
                : "ADD TO CART"}
            </button>
            <button
              className={`${styles.btnWish} ${isWishlisted ? styles.btnWishActive : ""}`}
              aria-label="Wishlist"
              onClick={handleWishlist}
            >
              {isWishlisted ? "❤️" : "🤍"}
            </button>
          </div>

          <div className={styles.divider} />

          <Accordion title="Product Details" defaultOpen>
            <table className={styles.detailTable}>
              <tbody>
                {product.type && (
                  <tr>
                    <td>Type</td>
                    <td>{product.type}</td>
                  </tr>
                )}
                {product.brand && (
                  <tr>
                    <td>Brand</td>
                    <td>{product.brand}</td>
                  </tr>
                )}
                {product.color && (
                  <tr>
                    <td>Colour</td>
                    <td>{product.color}</td>
                  </tr>
                )}
                {product.fit && (
                  <tr>
                    <td>Fit</td>
                    <td>{product.fit}</td>
                  </tr>
                )}
                {product.sleeve && (
                  <tr>
                    <td>Sleeve</td>
                    <td>{product.sleeve}</td>
                  </tr>
                )}
                {product.offer && (
                  <tr>
                    <td>Offer</td>
                    <td>{product.offer}</td>
                  </tr>
                )}
                {product.discount && (
                  <tr>
                    <td>Discount</td>
                    <td>{product.discount} off</td>
                  </tr>
                )}
              </tbody>
            </table>
          </Accordion>

          <Accordion title="Delivery & Returns">
            <p className={styles.accordionText}>
              Free delivery on orders above ₹999. Standard delivery in 3–5
              business days. Easy 7-day returns on all products.
            </p>
          </Accordion>

          <Accordion title="Brand Info">
            <p className={styles.accordionText}>
              <strong>{product.brand}</strong> is part of the UN1Q family —
              crafting streetwear that blends comfort with culture.
            </p>
          </Accordion>
        </div>
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}
    </>
  );
};

export default ProductDetailPage;
