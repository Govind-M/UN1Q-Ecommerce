import { useEffect, useState, useCallback } from "react";
import styles from "../../styles/Admin.module.css";
import { getInventorySummary, getInventoryList, updateVariantStock } from "../../services/api";

const PLACEHOLDER = "https://placehold.co/80x100/f0ede8/888?text=UN1Q";

const AdminInventory = () => {
  const [summary, setSummary] = useState({
    total_units: 0,
    reserved_units: 0,
    out_of_stock_count: 0,
    low_stock_count: 0,
    total_skus: 0,
  });

  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [modalStock, setModalStock] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchSummary = async () => {
    try {
      const data = await getInventorySummary();
      setSummary(data);
    } catch (err) {
      console.error("Error fetching inventory summary:", err);
    }
  };

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getInventoryList({
        page,
        search,
        status: statusFilter,
      });
      setVariants(data.results || data);
      setTotalCount(data.count || (data.results ? data.results.length : 0));
    } catch (err) {
      console.error("Error fetching inventory list:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleInlineStockChange = async (variant, delta) => {
    const nextStock = Math.max(variant.reserved_quantity, variant.stock_quantity + delta);
    if (nextStock === variant.stock_quantity) return;

    try {
      await updateVariantStock(variant.id, nextStock);
      showToast(`SKU ${variant.sku} stock updated to ${nextStock}`);
      fetchInventory();
      fetchSummary();
    } catch (err) {
      alert(err.message);
    }
  };

  const openAdjustModal = (variant) => {
    setSelectedVariant(variant);
    setModalStock(variant.stock_quantity);
  };

  const handleModalSave = async (e) => {
    e.preventDefault();
    if (!selectedVariant) return;

    const newStockNum = parseInt(modalStock, 10);
    if (isNaN(newStockNum) || newStockNum < 0) {
      alert("Please enter a valid stock quantity.");
      return;
    }

    if (newStockNum < selectedVariant.reserved_quantity) {
      alert(`Stock cannot be set lower than currently reserved quantity (${selectedVariant.reserved_quantity}).`);
      return;
    }

    setIsUpdating(true);
    try {
      await updateVariantStock(selectedVariant.id, newStockNum);
      showToast(`SKU ${selectedVariant.sku} updated to ${newStockNum} units.`);
      setSelectedVariant(null);
      fetchInventory();
      fetchSummary();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={styles.pageContent}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Inventory Management</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>
            Real-time SKU physical stock control and active cart reservation monitoring.
          </p>
        </div>
      </div>

      <div className={styles.statsGrid} style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#EFF6FF", color: "#2563EB" }}>📦</div>
          <p className={styles.statLabel}>Total Units in Stock</p>
          <p className={styles.statValue}>{summary.total_units.toLocaleString()}</p>
          <p className={styles.statTrend} style={{ color: "#64748b" }}>Across {summary.total_skus} total SKUs</p>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#FEF3C7", color: "#D97706" }}>⚠️</div>
          <p className={styles.statLabel}>Low Stock Alert SKUs</p>
          <p className={styles.statValue} style={{ color: "#D97706" }}>{summary.low_stock_count}</p>
          <p className={styles.statTrend} style={{ color: "#D97706" }}>≤ 5 Available Units</p>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#FEE2E2", color: "#DC2626" }}>🚫</div>
          <p className={styles.statLabel}>Out of Stock SKUs</p>
          <p className={styles.statValue} style={{ color: "#DC2626" }}>{summary.out_of_stock_count}</p>
          <p className={styles.statTrend} style={{ color: "#DC2626" }}>0 Units Available</p>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#F3E8FF", color: "#9333EA" }}>🔒</div>
          <p className={styles.statLabel}>Active Cart Reservations</p>
          <p className={styles.statValue} style={{ color: "#9333EA" }}>{summary.reserved_units.toLocaleString()}</p>
          <p className={styles.statTrend} style={{ color: "#64748b" }}>Held in active checkouts</p>
        </div>
      </div>

      <div className={styles.filterBar} style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "14px" }}>
        <div className={styles.searchBox} style={{ maxWidth: "420px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className={styles.searchBoxInput}
            placeholder="Search by Product Name or SKU..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <select
            className={styles.chartFilter}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{ padding: "8px 14px", borderRadius: "10px", fontSize: "13px" }}
          >
            <option value="">All Stock Statuses</option>
            <option value="in_stock">In Stock (&gt; 5)</option>
            <option value="low_stock">Low Stock (1 – 5)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>
        </div>
      </div>

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
          </div>
        ) : variants.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
            <p style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 6px" }}>No inventory records found</p>
            <p style={{ fontSize: "13px", margin: 0 }}>Try clearing search or status filters.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.tableHead}>Product</th>
                <th className={styles.tableHead}>SKU</th>
                <th className={styles.tableHead}>Size & Color</th>
                <th className={styles.tableHead}>Physical Stock</th>
                <th className={styles.tableHead}>Reserved</th>
                <th className={styles.tableHead}>Available</th>
                <th className={styles.tableHead}>Status</th>
                <th className={styles.tableHead} style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => {
                const isOutOfStock = v.available_stock === 0;
                const isLowStock = v.available_stock > 0 && v.available_stock <= 5;

                return (
                  <tr key={v.id} className={styles.tableRow}>
                    <td className={styles.tableCell}>
                      <div className={styles.productCell}>
                        <img
                          src={v.product_image || PLACEHOLDER}
                          alt={v.product_name}
                          className={styles.productThumb}
                          onError={(e) => (e.target.src = PLACEHOLDER)}
                        />
                        <div>
                          <p className={styles.productName}>{v.product_name}</p>
                          <p className={styles.productSku}>{v.category_label}</p>
                        </div>
                      </div>
                    </td>

                    <td className={styles.tableCell}>
                      <span style={{ fontFamily: "monospace", fontWeight: "600", fontSize: "12px", color: "#0f766e" }}>
                        {v.sku}
                      </span>
                    </td>

                    <td className={styles.tableCell}>
                      <span style={{ fontWeight: "700", color: "#1e293b" }}>{v.size}</span>
                      {v.color && <span style={{ color: "#64748b", marginLeft: "6px" }}>({v.color})</span>}
                    </td>

                    <td className={styles.tableCell}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <button
                          onClick={() => handleInlineStockChange(v, -1)}
                          disabled={v.stock_quantity <= v.reserved_quantity}
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            background: "#fff",
                            cursor: "pointer",
                            fontWeight: "bold",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          −
                        </button>
                        <span style={{ minWidth: "32px", textAlign: "center", fontWeight: "700", fontSize: "14px" }}>
                          {v.stock_quantity}
                        </span>
                        <button
                          onClick={() => handleInlineStockChange(v, 1)}
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            background: "#fff",
                            cursor: "pointer",
                            fontWeight: "bold",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td className={styles.tableCell}>
                      <span style={{ color: v.reserved_quantity > 0 ? "#9333ea" : "#64748b", fontWeight: "600" }}>
                        {v.reserved_quantity}
                      </span>
                    </td>

                    <td className={styles.tableCell}>
                      <span
                        style={{
                          fontWeight: "800",
                          fontSize: "14px",
                          color: isOutOfStock ? "#dc2626" : isLowStock ? "#d97706" : "#16a34a",
                        }}
                      >
                        {v.available_stock}
                      </span>
                    </td>

                    <td className={styles.tableCell}>
                      {isOutOfStock ? (
                        <span className={`${styles.statusBadge} ${styles.badgeBlocked}`}>OUT OF STOCK</span>
                      ) : isLowStock ? (
                        <span
                          className={styles.statusBadge}
                          style={{ background: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A" }}
                        >
                          LOW STOCK ({v.available_stock})
                        </span>
                      ) : (
                        <span className={`${styles.statusBadge} ${styles.badgeActive}`}>IN STOCK</span>
                      )}
                    </td>

                    <td className={styles.tableCell} style={{ textAlign: "right" }}>
                      <button
                        className={styles.viewBtn}
                        onClick={() => openAdjustModal(v)}
                        style={{ padding: "6px 14px", fontWeight: "600" }}
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {totalCount > 10 && (
          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
              Showing page {page} (Total {totalCount} SKU items)
            </span>
            <div className={styles.paginationBtns}>
              <button
                className={styles.pagBtn}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ‹
              </button>
              <button className={`${styles.pagBtn} ${styles.pagBtnActive}`}>{page}</button>
              <button
                className={styles.pagBtn}
                onClick={() => setPage((p) => p + 1)}
                disabled={variants.length < 10}
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedVariant && (
        <div className={styles.modalOverlay} onClick={() => setSelectedVariant(null)}>
          <div
            className={styles.modal}
            style={{ maxWidth: "460px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Set Physical Stock</h2>
                <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "12px" }}>
                  SKU: {selectedVariant.sku} — {selectedVariant.product_name} ({selectedVariant.size})
                </p>
              </div>
              <button className={styles.modalCloseBtn} onClick={() => setSelectedVariant(null)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleModalSave} className={styles.modalForm}>
              <div className={styles.formField} style={{ marginBottom: "24px" }}>
                <label className={styles.formLabel}>
                  Total Stock Quantity <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  min={selectedVariant.reserved_quantity}
                  className={styles.formInput}
                  value={modalStock}
                  onChange={(e) => setModalStock(e.target.value)}
                  required
                />
                <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                  Currently reserved in active carts: {selectedVariant.reserved_quantity} units
                </span>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setSelectedVariant(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Saving..." : "Save Stock Level"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "28px",
            right: "28px",
            background: "#0f172a",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: "8px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            zIndex: 9999,
            fontSize: "13px",
            fontWeight: "600",
          }}
        >
          ✓ {toastMessage}
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
