import styles from "../styles/ProductListingPage.module.css"

function FilterGroup({ label, children }) {
  return (
    <div className={styles.filterGroup}>
      <p className={styles.filterLabel}>{label}</p>
      {children}
      <div className={styles.filterDivider} />
    </div>
  );
}

export default FilterGroup;
