import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectProductModal,
  closeProductModal,
  addAdminProduct,
  updateAdminProduct,
} from "../../features/admin/adminSlice";
import { CATEGORIES } from "../../services/categoryApi";
import styles from "../../styles/Admin.module.css";

const FormField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}) => (
  <div className={styles.formField}>
    <label className={styles.formLabel}>
      {label}
      {required && <span className={styles.required}>*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={styles.formInput}
      required={required}
    />
  </div>
);

const FormSelect = ({ label, name, value, onChange, options, required }) => (
  <div className={styles.formField}>
    <label className={styles.formLabel}>
      {label}
      {required && <span className={styles.required}>*</span>}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className={styles.formSelect}
      required={required}
    >
      <option value="">— Select —</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

const ProductModal = () => {
  const dispatch = useDispatch();
  const { open, mode, product } = useSelector(selectProductModal);

  const EMPTY = {
    name: "",
    brand: "",
    categoryId: "",
    category: "",
    price: "",
    image: "",
    type: "",
    color: "",
    size: "",
    fit: "",
    discount: "",
    offer: "",
    status: "active",
  };

  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const categoryOptions = CATEGORIES.map((cat) => ({
    value: cat.id,
    label: `${cat.gender === "unisex" ? "" : cat.gender.toUpperCase() + " - "}${cat.label}`,
  }));

  useEffect(() => {
    if (open) {
      setError("");
      setForm(
        product
          ? {
              ...product,
              price: String(product.price),
              size: product.size?.join(", ") || "",
              offer: product.offer || "",
            }
          : EMPTY,
      );
    }
  }, [open, product]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "categoryId") {
      const selected = CATEGORIES.find((c) => c.id === value);
      setForm((prev) => ({
        ...prev,
        categoryId: value,
        category: selected?.label ?? "",
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.categoryId) {
      setError("Please select a category.");
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      price: Number(form.price),

      size: form.size ? form.size.split(",").map((s) => s.trim()) : [],

      offer: form.offer || null,
    };

    try {
      if (mode === "add") {
        await dispatch(addAdminProduct(payload)).unwrap();
      } else {
        await dispatch(updateAdminProduct(payload)).unwrap();
      }
    } catch (err) {
      setError(err || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={() => dispatch(closeProductModal())}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {mode === "add" ? "Add New Product" : "Edit Product"}
          </h2>
          <button
            className={styles.modalCloseBtn}
            onClick={() => dispatch(closeProductModal())}
          >
            ✕
          </button>
        </div>

        {error && <p className={styles.modalError}>{error}</p>}

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGrid}>
            <FormField
              label="Product Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Men's Black Cotton Shirt"
              required
            />
            <FormField
              label="Brand"
              name="brand"
              value={form.brand}
              onChange={handleChange}
              placeholder="e.g. UN1Q"
              required
            />
            <FormSelect
              label="Category"
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              options={categoryOptions}
              required
            />
            <FormField
              label="Price (₹)"
              name="price"
              value={form.price}
              onChange={handleChange}
              type="number"
              placeholder="999"
              required
            />
            <FormField
              label="Image URL"
              name="image"
              value={form.image}
              onChange={handleChange}
              placeholder="https://..."
            />
            <FormField
              label="Type"
              name="type"
              value={form.type}
              onChange={handleChange}
              placeholder="e.g. Track Pants"
            />

            <FormField
              label="Color"
              name="color"
              value={form.color}
              onChange={handleChange}
              placeholder="e.g. Brown"
            />

            <FormField
              label="Sizes (comma separated)"
              name="size"
              value={form.size}
              onChange={handleChange}
              placeholder="XS, S, M, L"
            />

            <FormField
              label="Fit"
              name="fit"
              value={form.fit}
              onChange={handleChange}
              placeholder="e.g. Oversized Fit"
            />

            <FormField
              label="Discount"
              name="discount"
              value={form.discount}
              onChange={handleChange}
              placeholder="e.g. 20%"
            />

            <FormField
              label="Offer"
              name="offer"
              value={form.offer}
              onChange={handleChange}
              placeholder="Optional"
            />
            <FormSelect
              label="Status"
              name="status"
              value={form.status}
              onChange={handleChange}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => dispatch(closeProductModal())}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={saving}
            >
              {saving
                ? "Saving…"
                : mode === "add"
                  ? "Add Product"
                  : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
