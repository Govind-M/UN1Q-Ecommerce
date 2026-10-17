import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { selectCartCount } from "../features/cart/cartSlice";
import { selectWishlistCount } from "../features/wishlist/wishlistSlice";
import CategorySlider from "./CategorySlider";
import { searchProductsApi } from "../services/categoryApi";
import styles from "../styles/Navbar.module.css";

function Navbar({ onCategoryChange, activeCategory = "MEN" }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const cartCount = useSelector(selectCartCount);
  const wishlistCount = useSelector(selectWishlistCount);

  // Ref to hold debounce timer between re-renders
  const debounceRef = useRef(null);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchVal(value);

    if (!value.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    setShowDropdown(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // 300ms debounce before querying backend API
    debounceRef.current = setTimeout(async () => {
      const data = await searchProductsApi(value);
      setResults(data.slice(0, 6)); // Preview top 6 results
      setLoading(false);
    }, 300);
  };

  const handleSelectProduct = (product) => {
    setSearchVal("");
    setShowDropdown(false);
    const categorySlug = product.categoryId || product.category_slug || "all";
    navigate(`/products/${categorySlug}/${product.id}`);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navLeft}>
        <Link to={"/home"} className={styles.navBrand}>
          UN1Q
        </Link>
        <CategorySlider active={activeCategory} onChange={onCategoryChange} />
      </div>

      <div className={styles.navSearch}>
        <svg
          className={styles.searchIcon}
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search the collection..."
          value={searchVal}
          onChange={handleSearch}
          onFocus={() => searchVal && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        />
        {showDropdown && (
          <div className={styles.searchDropdown}>
            {loading ? (
              <div className={styles.searchStateText}>
                <span className={styles.searchSpinner} /> Searching inventory...
              </div>
            ) : results.length > 0 ? (
              results.map((item) => (
                <div
                  key={`${item.id}-${item.categoryId || item.category_slug}`}
                  className={styles.searchItem}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevents input onBlur race condition
                    handleSelectProduct(item);
                  }}
                >
                  <img src={item.image} alt={item.name} />
                  <div>
                    <p>{item.name}</p>
                    <span>₹{item.price}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.searchStateText}>No matching products found</div>
            )}
          </div>
        )}
      </div>

      <div className={styles.navRight}>
        <Link
          to={user ? "/wishlist" : "/login"}
          state={!user ? { from: { pathname: "/wishlist" } } : undefined}
          className={styles.navIconBtn}
          title={user ? "Wishlist" : "Login to view wishlist"}
        >
          <div className={styles.iconWrap}>
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill={user ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "#374151" }}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {wishlistCount > 0 && (
              <span className={styles.badge}>
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </div>
        </Link>

        <Link to="/cart" className={styles.navIconBtn} title="Cart">
          <div className={styles.iconWrap}>
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cartCount > 0 && (
              <span className={styles.badge}>
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </div>
        </Link>

        {!user ? (
          <Link to="/login" className={styles.navLoginBtn}>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Login
          </Link>
        ) : (
          <div className={styles.navUserArea}>
            <Link to="/profile" className={styles.navUsername}>
              👤 {user.name.split(" ")[0]}
            </Link>
            <Link
              to="/orders"
              className={styles.navOrdersBtn}
              title="My Orders"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" ry="1" />
                <line x1="9" y1="12" x2="15" y2="12" />
                <line x1="9" y1="16" x2="13" y2="16" />
              </svg>
              My Orders
            </Link>
            <button
              className={styles.navLogoutBtn}
              onClick={handleLogout}
              title="Logout"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
