import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllAdminProducts,
  selectAdminProducts,
  selectProductSearch,
  setProductSearch,
  openAddProductModal,
  openEditProductModal,
  updateProductStatus,
} from "../../features/admin/adminSlice";
import ProductModal from "./ProductModal";
import styles from "../../styles/Admin.module.css";

const getPagination = (currentPage, totalPages) => {
  const pages = [];
  const maxVisible = 5;

  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, currentPage + 2);

  if (currentPage <= 3) {
    start = 1;
    end = Math.min(totalPages, maxVisible);
  }

  if (currentPage >= totalPages - 2) {
    start = Math.max(1, totalPages - (maxVisible - 1));
    end = totalPages;
  }

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push("...");
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) pages.push("...");
    pages.push(totalPages);
  }

  return pages;
};

const StatusBadge = ({ status }) => (
  <span
    className={`${styles.statusBadge} ${
      status === "active" ? styles.badgeActive : styles.badgeInactive
    }`}
  >
    {status.toUpperCase()}
  </span>
);

const ProductRow = ({ product, onEdit, onToggleStatus }) => {
  const status = product.status ?? "inactive";

  const isActive = status === "active";

  return (
    <tr className={styles.tableRow}>
      <td className={styles.tableCell}>
        <div className={styles.productCell}>
          <img
            src={product.image}
            alt={product.name}
            className={styles.productThumb}
            onError={(e) => (e.target.style.background = "#e5e7eb")}
          />
          <div>
            <p className={styles.productName}>{product.name}</p>
          </div>
        </div>
      </td>

      <td className={styles.tableCell}>{product.brand ?? "—"}</td>
      <td className={styles.tableCell}>{product.category ?? "—"}</td>

      <td className={styles.tableCell}>
        ₹{product.price?.toLocaleString("en-IN")}
      </td>

      <td className={styles.tableCell}>
        <StatusBadge status={status} />
      </td>

      <td className={styles.tableCell}>
        <div className={styles.actionBtns}>
          <button
            className={styles.editBtn}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(product);
            }}
          >
            EDIT
          </button>

          <button
            className={isActive ? styles.disableBtn : styles.enableBtn}
            onClick={(e) => {
              e.stopPropagation(); 
              onToggleStatus(product);
            }}
          >
            {isActive ? "DEACTIVATE" : "ACTIVATE"}
          </button>
        </div>
      </td>
    </tr>
  );
};

const ProductsFilterBar = ({ searchQuery, onSearch }) => (
  <div className={styles.filterBar}>
    <div className={styles.searchBox}>
      <input
        type="text"
        placeholder="Search product gallery..."
        value={searchQuery}
        onChange={(e) => onSearch(e.target.value)}
        className={styles.searchBoxInput}
      />
    </div>
  </div>
);

const AdminProducts = () => {
  const dispatch = useDispatch();

  const products = useSelector(selectAdminProducts);
  const searchQuery = useSelector(selectProductSearch);
  const productsStatus = useSelector((s) => s.admin.productsStatus);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (productsStatus === "idle") {
      dispatch(fetchAllAdminProducts());
    }
  }, [dispatch, productsStatus]);

  const filtered = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedProducts = filtered.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleToggleStatus = (product) => {
    const newStatus = product.status === "active" ? "inactive" : "active";

    dispatch(
      updateProductStatus({
        id: product.id,
        categoryId: product.categoryId,
        status: newStatus,
      }),
    );
  };

  return (
    <div className={styles.pageContent}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Products</h1>

        <button
          className={styles.primaryBtn}
          onClick={() => dispatch(openAddProductModal())}
        >
          + New Product
        </button>
      </div>

      <ProductsFilterBar
        searchQuery={searchQuery}
        onSearch={(v) => dispatch(setProductSearch(v))}
      />

      <div className={styles.tableCard}>
        {productsStatus === "loading" ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyChart}>No products found</div>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  {[
                    "PRODUCT",
                    "BRAND",
                    "CATEGORY",
                    "PRICE",
                    "STATUS",
                    "ACTIONS",
                  ].map((h) => (
                    <th key={h} className={styles.tableHead}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {paginatedProducts.map((product) => (
                  <ProductRow
                    key={`${product.id}-${product.categoryId}`}
                    product={product}
                    onEdit={(p) => dispatch(openEditProductModal(p))}
                    onToggleStatus={handleToggleStatus}
                  />
                ))}
              </tbody>
            </table>

            <div className={styles.pagination}>
              <span className={styles.paginationInfo}>
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)} of{" "}
                {filtered.length} products
              </span>

              <div className={styles.paginationBtns}>
                <button
                  className={styles.pagBtn}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  ‹
                </button>

                {getPagination(currentPage, totalPages).map((item, index) =>
                  item === "..." ? (
                    <span key={`dots-${index}`} className={styles.pagEllipsis}>
                      ...
                    </span>
                  ) : (
                    <button
                      key={`${item}-${index}`}
                      className={`${styles.pagBtn} ${
                        currentPage === item ? styles.pagBtnActive : ""
                      }`}
                      onClick={() => setCurrentPage(item)}
                    >
                      {item}
                    </button>
                  ),
                )}

                <button
                  className={styles.pagBtn}
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  ›
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <ProductModal />
    </div>
  );
};

export default AdminProducts;
