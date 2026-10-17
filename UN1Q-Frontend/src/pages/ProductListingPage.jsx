import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";

import {
  loadAllProducts,
  loadFilters,
} from "../features/products/productsSlice";
import { setProduct, setGender } from "../features/ui/uiSlice";

import { CATEGORIES } from "../services/categoryApi";
import ProductCard from "../components/ProductCard";

import Navbar from "../components/Navbar";
import styles from "../styles/ProductListingPage.module.css";

import FilterGroup from "../components/FilterGroup";
import CheckItem from "../components/CheckItem";

const SORT_OPTIONS = [
  { value: "", label: "Relevance" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "name_asc", label: "Name: A → Z" },
  { value: "disc_desc", label: "Discount: Highest First" },
];

const COLOR_HEX = {
  Black: "#111",
  White: "#f5f5f5",
  Navy: "#001F5B",
  Grey: "#999",
  Olive: "#6B7645",
  Beige: "#d4b99a",
  Red: "#cc3333",
  Blue: "#2255cc",
  Green: "#337733",
  Brown: "#7a4e2d",
  Maroon: "#800000",
  Orange: "#e87722",
  Yellow: "#f5c518",
  Pink: "#f48baa",
  Purple: "#6a0dad",
};

const ProductListingPage = () => {
  const dispatch = useDispatch();

  const activeGender = useSelector((state) => state.ui.activeGender);

  const items = useSelector((state) => state.products.items);
  const status = useSelector((state) => state.products.listingStatus);

  const loadedCatId = useSelector((state) => state.products.loadedCategoryId);
  const filters = useSelector((state) => state.products.filters);
  const filtersStatus = useSelector((state) => state.products.filtersStatus);

  const { categoryId } = useParams();
  const navigate = useNavigate();

  const categoryMeta = CATEGORIES.find((c) => c.id === categoryId);

  const isShoes = categoryId?.includes("shoes");
  const isBags = categoryId === "bags";
  const isCaps = categoryId === "caps";
  const hasClothingFilters = !isShoes && !isBags && !isCaps;

  useEffect(() => {
    if (!categoryId) return;
    if (loadedCatId !== categoryId) {
      dispatch(loadAllProducts(categoryId));
    }
  }, [dispatch, categoryId, loadedCatId]);

  useEffect(() => {
    if (filtersStatus === "idle") {
      dispatch(loadFilters());
    }
  }, [dispatch, filtersStatus]);

  const [searchQuery, setSearchQuery] = useState("");

  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedFits, setSelectedFits] = useState([]);
  const [selectedSleeves, setSelectedSleeves] = useState([]);
  const [selectedOffers, setSelectedOffers] = useState([]);
  const [selectedDisc, setSelectedDisc] = useState([]);
  const [sortBy, setSortBy] = useState("");

  useEffect(() => {
    setSelectedBrands([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedFits([]);
    setSelectedSleeves([]);
    setSelectedOffers([]);
    setSelectedDisc([]);
    setSortBy("");
    setSearchQuery("");
  }, [categoryId]);

  const handleBrandToggle = (val) => {
    setSelectedBrands((prev) => {
      const alreadySelected = prev.includes(val);
      if (alreadySelected) {
        return prev.filter((item) => item !== val);
      } else {
        return [...prev, val];
      }
    });
  };

  const handleColorToggle = (val) => {
    setSelectedColors((prev) => {
      const alreadySelected = prev.includes(val);
      if (alreadySelected) {
        return prev.filter((item) => item !== val);
      } else {
        return [...prev, val];
      }
    });
  };

  const handleSizeToggle = (val) => {
    setSelectedSizes((prev) => {
      const alreadySelected = prev.includes(val);
      if (alreadySelected) {
        return prev.filter((item) => item !== val);
      } else {
        return [...prev, val];
      }
    });
  };

  const handleFitToggle = (val) => {
    setSelectedFits((prev) => {
      const alreadySelected = prev.includes(val);
      if (alreadySelected) {
        return prev.filter((item) => item !== val);
      } else {
        return [...prev, val];
      }
    });
  };

  const handleSleeveToggle = (val) => {
    setSelectedSleeves((prev) => {
      const alreadySelected = prev.includes(val);
      if (alreadySelected) {
        return prev.filter((item) => item !== val);
      } else {
        return [...prev, val];
      }
    });
  };

  const handleOfferToggle = (val) => {
    setSelectedOffers((prev) => {
      const alreadySelected = prev.includes(val);
      if (alreadySelected) {
        return prev.filter((item) => item !== val);
      } else {
        return [...prev, val];
      }
    });
  };

  const handleDiscountToggle = (val) => {
    setSelectedDisc((prev) => {
      const alreadySelected = prev.includes(val);
      if (alreadySelected) {
        return prev.filter((item) => item !== val);
      } else {
        return [...prev, val];
      }
    });
  };

  const displayedProducts = useMemo(() => {
    let result = items.filter((p) => p.status === "active");

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.type?.toLowerCase().includes(q),
      );
    }

    if (selectedBrands.length)
      result = result.filter((p) => selectedBrands.includes(p.brand));

    if (selectedColors.length)
      result = result.filter((p) => selectedColors.includes(p.color));

    if (selectedSizes.length)
      result = result.filter((p) =>
        Array.isArray(p.size)
          ? p.size.some((s) => selectedSizes.includes(s))
          : selectedSizes.includes(p.size),
      );

    if (selectedFits.length && hasClothingFilters)
      result = result.filter((p) => selectedFits.includes(p.fit));

    if (selectedSleeves.length && hasClothingFilters)
      result = result.filter((p) => selectedSleeves.includes(p.sleeve));

    if (selectedOffers.length)
      result = result.filter((p) => selectedOffers.includes(p.offer));

    if (selectedDisc.length)
      result = result.filter((p) => selectedDisc.includes(p.discount));

    if (sortBy === "price_asc") result.sort((a, b) => a.price - b.price);
    if (sortBy === "price_desc") result.sort((a, b) => b.price - a.price);
    if (sortBy === "name_asc")
      result.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "disc_desc")
      result.sort((a, b) => parseInt(b.discount) - parseInt(a.discount));

    return result;
  }, [
    items,
    searchQuery,
    selectedBrands,
    selectedColors,
    selectedSizes,
    selectedFits,
    selectedSleeves,
    selectedOffers,
    selectedDisc,
    sortBy,
    hasClothingFilters,
  ]);

  const hasActiveFilters = [
    selectedBrands,
    selectedColors,
    selectedSizes,
    selectedFits,
    selectedSleeves,
    selectedOffers,
    selectedDisc,
  ].some((f) => f.length > 0);

  const clearAll = () => {
    setSelectedBrands([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedFits([]);
    setSelectedSleeves([]);
    setSelectedOffers([]);
    setSelectedDisc([]);
    setSortBy("");
  };

  const handleProductClick = (productId) => {
    const product = items.find((p) => p.id === productId);

    if (product?.status !== "active") return;
    dispatch(setProduct({ categoryId, productId }));
    navigate(`/products/${categoryId}/${productId}`);
  };

  return (
    <>
      <Navbar
        activeCategory={activeGender}
        onCategoryChange={(cat) => dispatch(setGender(cat))}
        onSearch={setSearchQuery}
      />

      <div className={styles.breadcrumb}>
        <span className={styles.crumbLink} onClick={() => navigate("/home")}>
          Home
        </span>
        <span className={styles.crumbSep}>/</span>
        <span className={styles.crumbCurrent}>
          {categoryMeta?.label ?? categoryId}
        </span>
      </div>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarTitle}>FILTERS</span>
            {hasActiveFilters && (
              <button className={styles.clearBtn} onClick={clearAll}>
                Clear all
              </button>
            )}
          </div>

          {filters.brands?.length > 0 && (
            <FilterGroup label="Brand">
              {filters.brands.map((b) => (
                <CheckItem
                  key={b}
                  label={b}
                  checked={selectedBrands.includes(b)}
                  count={items.filter((p) => p.brand === b).length}
                  onChange={() => handleBrandToggle(b)}
                />
              ))}
            </FilterGroup>
          )}

          {filters.colors?.length > 0 && (
            <FilterGroup label="Color">
              <div className={styles.colorGrid}>
                {filters.colors
                  .filter((c) => items.some((p) => p.color === c))
                  .map((c) => (
                    <button
                      key={c}
                      className={`${styles.colorChip} ${selectedColors.includes(c) ? styles.colorChipActive : ""}`}
                      style={{ background: COLOR_HEX[c] ?? "#ccc" }}
                      title={c}
                      onClick={() => handleColorToggle(c)}
                      aria-label={c}
                    />
                  ))}
              </div>
            </FilterGroup>
          )}

          {isShoes
            ? filters.shoeSizes?.length > 0 && (
                <FilterGroup label="Shoe Size">
                  <div className={styles.chipRow}>
                    {filters.shoeSizes.map((s) => (
                      <button
                        key={s}
                        className={`${styles.chip} ${selectedSizes.includes(s) ? styles.chipActive : ""}`}
                        onClick={() => handleSizeToggle(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </FilterGroup>
              )
            : !isBags &&
              !isCaps &&
              filters.sizes?.length > 0 && (
                <FilterGroup label="Size">
                  <div className={styles.chipRow}>
                    {filters.sizes.map((s) => (
                      <button
                        key={s}
                        className={`${styles.chip} ${selectedSizes.includes(s) ? styles.chipActive : ""}`}
                        onClick={() => handleSizeToggle(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </FilterGroup>
              )}

          {hasClothingFilters && filters.fits?.length > 0 && (
            <FilterGroup label="Fit">
              {filters.fits
                .filter((f) => items.some((p) => p.fit === f))
                .map((f) => (
                  <CheckItem
                    key={f}
                    label={f}
                    checked={selectedFits.includes(f)}
                    count={items.filter((p) => p.fit === f).length}
                    onChange={() => handleFitToggle(f)}
                  />
                ))}
            </FilterGroup>
          )}

          {hasClothingFilters &&
            filters.sleeves?.length > 0 &&
            items.some((p) => p.sleeve) && (
              <FilterGroup label="Sleeve">
                {filters.sleeves
                  .filter((s) => items.some((p) => p.sleeve === s))
                  .map((s) => (
                    <CheckItem
                      key={s}
                      label={s}
                      checked={selectedSleeves.includes(s)}
                      count={items.filter((p) => p.sleeve === s).length}
                      onChange={() => handleSleeveToggle(s)}
                    />
                  ))}
              </FilterGroup>
            )}

          {items.some((p) => p.offer) && filters.offers?.length > 0 && (
            <FilterGroup label="Offer">
              {filters.offers
                .filter((o) => items.some((p) => p.offer === o))
                .map((o) => (
                  <CheckItem
                    key={o}
                    label={o}
                    checked={selectedOffers.includes(o)}
                    count={items.filter((p) => p.offer === o).length}
                    onChange={() => handleOfferToggle(o)}
                  />
                ))}
            </FilterGroup>
          )}

          {(isShoes ? filters.shoeDiscounts : filters.discounts)?.filter((d) =>
            items.some((p) => p.discount === d),
          ).length > 0 && (
            <FilterGroup label="Discount">
              {(isShoes ? filters.shoeDiscounts : filters.discounts)
                .filter((d) => items.some((p) => p.discount === d))
                .map((d) => (
                  <CheckItem
                    key={d}
                    label={`${d} off`}
                    checked={selectedDisc.includes(d)}
                    count={items.filter((p) => p.discount === d).length}
                    onChange={() => handleDiscountToggle(d)}
                  />
                ))}
            </FilterGroup>
          )}
        </aside>

        <main className={styles.main}>
          <div className={styles.topbar}>
            <div>
              <h1 className={styles.mainTitle}>
                {categoryMeta?.label?.toUpperCase() ?? categoryId}
              </h1>
              <p className={styles.itemCount}>
                {status === "loading"
                  ? "Loading…"
                  : `${displayedProducts.length} items`}
              </p>
            </div>
            <div className={styles.sortWrap}>
              <label className={styles.sortLabel}>Sort by</label>
              <select
                className={styles.sortSelect}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {searchQuery.trim() && (
            <div className={styles.activePills}>
              <span className={styles.pill}>
                🔍 "{searchQuery}"
                <button
                  className={styles.pillX}
                  onClick={() => setSearchQuery("")}
                >
                  ×
                </button>
              </span>
            </div>
          )}

          {hasActiveFilters && (
            <div className={styles.activePills}>
              {[
                ...selectedBrands,
                ...selectedColors,
                ...selectedSizes,
                ...selectedFits,
                ...selectedSleeves,
                ...selectedOffers,
                ...selectedDisc.map((d) => `${d} off`),
              ].map((pill) => (
                <span key={pill} className={styles.pill}>
                  {pill}
                  <button
                    className={styles.pillX}
                    onClick={() => {
                      setSelectedBrands((p) => p.filter((x) => x !== pill));
                      setSelectedColors((p) => p.filter((x) => x !== pill));
                      setSelectedSizes((p) => p.filter((x) => x !== pill));
                      setSelectedFits((p) => p.filter((x) => x !== pill));
                      setSelectedSleeves((p) => p.filter((x) => x !== pill));
                      setSelectedOffers((p) => p.filter((x) => x !== pill));
                      setSelectedDisc((p) =>
                        p.filter((x) => `${x} off` !== pill),
                      );
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {status === "loading" && (
            <div className={styles.stateWrap}>
              <div className={styles.spinner} />
              <p className={styles.stateText}>Loading products…</p>
            </div>
          )}

          {status === "failed" && (
            <div className={styles.stateWrap}>
              <p className={styles.errorText}>
                ⚠ Failed to load products. Is json-server running?
              </p>
              <code className={styles.errorCode}>
                npx json-server --watch db.json --port 3000
              </code>
              <button
                className={styles.retryBtn}
                onClick={() => dispatch(loadAllProducts(categoryId))}
              >
                Retry
              </button>
            </div>
          )}

          {status === "succeeded" && displayedProducts.length === 0 && (
            <div className={styles.stateWrap}>
              <p className={styles.emptyIcon}>🛍</p>
              <p className={styles.emptyTitle}>
                {searchQuery.trim()
                  ? `No results for "${searchQuery}"`
                  : "No products match your filters"}
              </p>
              <button className={styles.retryBtn} onClick={clearAll}>
                Clear Filters
              </button>
            </div>
          )}

          {status === "succeeded" && displayedProducts.length > 0 && (
            <div className={styles.grid}>
              {displayedProducts.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  categoryId={categoryId}
                  index={i}
                  onClick={handleProductClick}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default ProductListingPage;
