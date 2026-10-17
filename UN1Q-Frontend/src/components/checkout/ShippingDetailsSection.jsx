import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import {
  selectShippingDetails,
  updateShippingField,
} from "../../features/checkout/checkoutSlice";
import StepHeader from "./StepHeader";
import FormField from "./FormField";
import styles from "../../styles/CheckoutPage.module.css";

// ─────────────────────────────────────────────────────────────────────────────
// ShippingDetailsSection  —  Step 1
//
// Renders the full shipping address form: name, phone, street address,
// city, state and postal code.
//
// All field values are read directly from Redux (checkoutSlice.shippingDetails)
// and written back via updateShippingField — no local state needed.
//
// Props:
//   userName  {string|undefined}  — pre-fills the Full Name input with the
//                                   logged-in user's name on first render.
//                                   Once the user types, Redux takes over.
// ─────────────────────────────────────────────────────────────────────────────

const ShippingDetailsSection = ({ userName }) => {
  const dispatch = useDispatch();
  const shipping = useSelector(selectShippingDetails);



  useEffect(() => {
    if (userName && !shipping.fullName) {
      dispatch(updateShippingField({ field: "fullName", value: userName }));
    }
  }, [userName]);


  const field = (key) => (value) =>
    dispatch(updateShippingField({ field: key, value }));

  return (
    <section className={styles.stepCard}>
      <StepHeader number={1} title="Shipping Details" />

      <div className={styles.fieldRow}>
        <FormField
          label="FULL NAME"
          id="fullName"
          value={shipping.fullName ?? ""}
          onChange={field("fullName")}
          placeholder="Alexander Curator"
          half
        />
        <FormField
          label="PHONE NUMBER"
          id="phone"
          value={shipping.phone}
          onChange={field("phone")}
          placeholder="+1 (555) 000-0000"
          type="tel"
          half
        />
      </div>

      <div className={styles.fieldRow}>
        <FormField
          label="SHIPPING ADDRESS"
          id="address"
          value={shipping.address}
          onChange={field("address")}
          placeholder="123 Gallery Street, Creative District"
        />
      </div>

      <div className={styles.fieldRow}>
        <FormField
          id="city"
          value={shipping.city}
          onChange={field("city")}
          placeholder="City"
          half
        />
        <FormField
          id="state"
          value={shipping.stateRegion ?? ""}
          onChange={field("stateRegion")}
          placeholder="State"
          half
        />
        <FormField
          id="postalCode"
          value={shipping.postalCode}
          onChange={field("postalCode")}
          placeholder="Postal Code"
          half
        />
      </div>
    </section>
  );
};

export default ShippingDetailsSection;
