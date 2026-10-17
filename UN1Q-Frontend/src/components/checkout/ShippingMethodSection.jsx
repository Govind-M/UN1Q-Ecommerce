import { useDispatch, useSelector } from "react-redux";
import {
  selectShippingMethod,
  setShippingMethod,
} from "../../features/checkout/checkoutSlice";
import StepHeader from "./StepHeader";
import styles from "../../styles/CheckoutPage.module.css";


const METHODS = [
  {
    id: "standard",
    name: "Standard Delivery",
    days: "4–6 Business Days",
    price: "Free",
  },
  {
    id: "express",
    name: "Express Shipping",
    days: "1–2 Business Days",
    price: "₹15.00",
  },
];

const ShippingMethodSection = () => {
  const dispatch       = useDispatch();
  const activeMethod   = useSelector(selectShippingMethod);

  return (
    <section className={styles.stepCard}>
      <StepHeader number={2} title="Shipping Method" />

      <div className={styles.methodRow}>
        {METHODS.map((method) => {
          const isActive = activeMethod === method.id;
          return (
            <button
              key={method.id}
              className={`${styles.methodCard} ${isActive ? styles.methodCardActive : ""}`}
              onClick={() => dispatch(setShippingMethod(method.id))}
            >
              <span
                className={isActive ? styles.methodRadioActive : styles.methodRadio}
              />

              <div className={styles.methodInfo}>
                <p className={styles.methodName}>{method.name}</p>
                <p className={styles.methodDays}>{method.days}</p>
              </div>

              <span className={styles.methodPrice}>{method.price}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default ShippingMethodSection;