import styles from "../../styles/CheckoutPage.module.css";



const FormField = ({
  label,
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  half = false,
}) => (
  <div className={`${styles.field} ${half ? styles.fieldHalf : ""}`}>
    {label && (
      <label className={styles.fieldLabel} htmlFor={id}>
        {label}
      </label>
    )}
    <input
      id={id}
      type={type}
      className={styles.fieldInput}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete="off"
    />
  </div>
);

export default FormField;