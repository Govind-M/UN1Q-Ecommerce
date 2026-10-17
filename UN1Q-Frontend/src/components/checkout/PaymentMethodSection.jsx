import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import {
  selectPaymentMethod,
  selectCardDetails,
  setPaymentMethod,
  updateCardField,
} from "../../features/checkout/checkoutSlice";
import StepHeader from "./StepHeader";
import styles from "../../styles/CheckoutPage.module.css";


const TABS = [
  { id: "card", label: "Credit Card" },
  { id: "upi", label: "UPI / Bank Transfer" },
];


const formatCardNumber = (val) => {
  const digits = val.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
};


const formatExpiry = (val) => {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2
    ? `${digits.slice(0, 2)}/${digits.slice(2)}`
    : digits;
};

const PaymentMethodSection = () => {
  const dispatch = useDispatch();
  const paymentMethod = useSelector(selectPaymentMethod);
  const card = useSelector(selectCardDetails);

  const handleCardNumber = useCallback(
    (e) =>
      dispatch(
        updateCardField({
          field: "cardNumber",
          value: formatCardNumber(e.target.value),
        }),
      ),
    [dispatch],
  );

  const handleExpiry = useCallback(
    (e) =>
      dispatch(
        updateCardField({
          field: "expiry",
          value: formatExpiry(e.target.value),
        }),
      ),
    [dispatch],
  );

  const handleCvv = useCallback(
    (e) =>
      dispatch(
        updateCardField({
          field: "cvv",
          value: e.target.value.replace(/\D/g, "").slice(0, 4),
        }),
      ),

    [dispatch],
  );

  const upiDetails = useSelector(
    (state) => state.checkout.cardDetails.upiId ?? "",
  );

  const handleUpi = useCallback(
    (e) =>
      dispatch(
        updateCardField({
          field: "upiId",
          value: e.target.value,
        }),
      ),
    [dispatch],
  );

  return (
    <section className={styles.stepCard}>
      <StepHeader number={3} title="Payment Method" />

      {/* ── Payment type tabs ──────────────────────────────────────────── */}
      <div className={styles.payTabs}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.payTab} ${
              paymentMethod === tab.id ? styles.payTabActive : ""
            }`}
            onClick={() => dispatch(setPaymentMethod(tab.id))}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Credit Card fields ─────────────────────────────────────────── */}
      {paymentMethod === "card" && (
        <div className={styles.cardFields}>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="cardNumber">
                CARD NUMBER
              </label>
              <div className={styles.cardInputWrap}>
                <input
                  id="cardNumber"
                  type="text"
                  className={styles.fieldInput}
                  value={card.cardNumber}
                  onChange={handleCardNumber}
                  placeholder="•••• •••• •••• 4422"
                  maxLength={19}
                  autoComplete="off"
                />
                <svg
                  className={styles.cardIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <rect
                    x="1"
                    y="4"
                    width="22"
                    height="16"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path d="M1 10h22" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          </div>

          <div className={styles.fieldRow}>
            <div className={`${styles.field} ${styles.fieldHalf}`}>
              <label className={styles.fieldLabel} htmlFor="expiry">
                EXPIRY DATE
              </label>
              <input
                id="expiry"
                type="text"
                className={styles.fieldInput}
                value={card.expiry}
                onChange={handleExpiry}
                placeholder="MM/YY"
                maxLength={5}
                autoComplete="off"
              />
            </div>
            <div className={`${styles.field} ${styles.fieldHalf}`}>
              <label className={styles.fieldLabel} htmlFor="cvv">
                CVV
              </label>
              <input
                id="cvv"
                type="password"
                className={styles.fieldInput}
                value={card.cvv}
                onChange={handleCvv}
                placeholder="•••"
                maxLength={4}
                autoComplete="off"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── UPI / Bank Transfer ────────────────────────────────────────── */}
      {paymentMethod === "upi" && (
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="upiId">
              UPI ID / ACCOUNT NUMBER
            </label>
            <input
              id="upiId"
              type="text"
              className={styles.fieldInput}
              value={card.upiId}
              onChange={handleUpi}
              placeholder="yourname@upi"
              autoComplete="off"
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default PaymentMethodSection;
