import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { registerUserAsync, resetAuthStatus } from "../features/auth/authSlice";
import styles from "../styles/auth.module.css";

const validate = (fields) => {
  const errors = {};

  if (!fields.name.trim()) errors.name = "Name is required.";
  else if (fields.name.trim().length < 2)
    errors.name = "Name must be at least 2 characters.";

  if (!fields.email.trim()) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
    errors.email = "Enter a valid email address.";

  if (!fields.password) errors.password = "Password is required.";
  else if (fields.password.length < 6)
    errors.password = "Password must be at least 6 characters.";

  return errors;
};

const INITIAL = { name: "", email: "", password: "" };

function Register() {
  const [fields, setFields] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const navigate = useNavigate();

  const dispatch = useDispatch();
  const { isLoading, user, error, success } = useSelector(
    (state) => state.auth
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({
      name: true,
      email: true,
      password: true,
    });

    const validationErrors = validate(fields);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    dispatch(registerUserAsync(fields));
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: { prefillEmail: fields.email },
        });
        dispatch(resetAuthStatus());
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [success, user, navigate, dispatch]);

  useEffect(() => {
    return () => dispatch(resetAuthStatus());
  }, [dispatch]);

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <div className={styles.logo}>🛍️</div>
          <h1>Create your account</h1>
        </div>

        {success && (
          <div className={`${styles.banner} ${styles.success}`} role="status">
            ✅ Account created! Redirecting you now…
          </div>
        )}
        {error && (
          <div className={`${styles.banner} ${styles.error}`} role="alert">
            ❌ {error}
          </div>
        )}

        <form className={styles.authForm} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Jane Doe"
              value={fields.name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={touched.name && errors.name ? styles.errorInput : ""}
              autoComplete="name"
              autoFocus
              disabled={isLoading || success}
            />
            {touched.name && errors.name && (
              <span className={styles.fieldError}>⚠ {errors.name}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="jane@example.com"
              value={fields.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={touched.email && errors.email ? styles.errorInput : ""}
              autoComplete="email"
              disabled={isLoading || success}
            />
            {touched.email && errors.email && (
              <span className={styles.fieldError}>⚠ {errors.email}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Min. 6 characters"
              value={fields.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className={
                touched.password && errors.password ? styles.errorInput : ""
              }
              autoComplete="new-password"
              disabled={isLoading || success}
            />
            {touched.password && errors.password && (
              <span className={styles.fieldError}>⚠ {errors.password}</span>
            )}
          </div>

          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={isLoading || success}
          >
            {isLoading && (
              <span className={styles.spinner} aria-hidden="true" />
            )}
            {isLoading
              ? "Creating account…"
              : success
                ? "Done! ✓"
                : "Create Account"}
          </button>
        </form>

        <div className={styles.authFooter}>
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
