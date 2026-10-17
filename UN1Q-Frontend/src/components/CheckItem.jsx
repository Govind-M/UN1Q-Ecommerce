import styles from "../styles/ProductListingPage.module.css"

function CheckItem({ label, checked, count, onChange }) {
  return (
    <label className={styles.checkItem}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className={styles.checkLabel}>{label}</span>
      <span className={styles.checkCount}>{count}</span>
    </label>
  );
}

export default CheckItem;
