
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, resetAuthStatus } from "../features/auth/authSlice";
import styles from "../styles/auth.module.css";

const validate = ({ email, password }) => {
  const errors = {};
  if (!email.trim()) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "Enter a valid email address.";
  if (!password.trim()) errors.password = "Password is required.";
  return errors;
};

function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isLoading, error, success, user } = useSelector(
    (state) => state.auth,
  );

  const [fields, setFields] = useState({
    email: location.state?.prefillEmail || "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (error === "BLOCKED_USER") {
      navigate("/blocked", { replace: true });
    }
  }, [error, navigate]);

  useEffect(() => {
    if (success && user) {
      const destination =
        user.role === "admin"
          ? "/admin"
          : location.state?.from?.pathname || "/home";

      const timer = setTimeout(() => {
        navigate(destination, { replace: true });
        dispatch(resetAuthStatus());
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [success, user, navigate, location, dispatch]);

  useEffect(() => {
    return () => dispatch(resetAuthStatus());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const validationErrors = validate(fields);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    dispatch(loginUser(fields));
  };

  const displayError = error && error !== "BLOCKED_USER" ? error : null;

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <div className={styles.logo}>🛍️</div>
          <h1>Welcome back</h1>
          <p>Sign in to continue shopping</p>
        </div>

        {success && (
          <div className={`${styles.banner} ${styles.success}`} role="status">
            ✅ Login successful! Redirecting…
          </div>
        )}
        {displayError && (
          <div className={`${styles.banner} ${styles.error}`} role="alert">
            ❌ {displayError}
          </div>
        )}

        <form className={styles.authForm} onSubmit={handleSubmit} noValidate>
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
              autoFocus
              disabled={isLoading || success}
            />
            {touched.email && errors.email && (
              <span className={styles.fieldError}>⚠ {errors.email}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                value={fields.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={
                  touched.password && errors.password ? styles.errorInput : ""
                }
                autoComplete="current-password"
                disabled={isLoading || success}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
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
            {isLoading ? "Signing in…" : success ? "Done! ✓" : "Sign In"}
          </button>
        </form>

        <div className={styles.authFooter}>
          Don't have an account? <Link to="/register">Sign up</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
