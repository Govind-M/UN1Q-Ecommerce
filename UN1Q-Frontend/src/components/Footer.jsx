import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setGender } from "../features/ui/uiSlice";
import styles from "../styles/Footer.module.css";



const Footer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleCollection = (gender) => {
    dispatch(setGender(gender));
    navigate("/home");
  };

  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>

      <div className={styles.brand}>
        <p className={styles.brandName}>UNIQ</p>
        <p className={styles.tagline}>
          Redefining luxury through the lens of minimalism and intentionality.
          <br />
          Every piece tells a story of craftsmanship.
        </p>
      </div>

      <div className={styles.shopBlock}>
        <p className={styles.shopHeading}>SHOP</p>
        <button
          className={styles.shopLink}
          onClick={() => handleCollection("MEN")}
        >
          Men's Collection
        </button>
        <button
          className={styles.shopLink}
          onClick={() => handleCollection("WOMEN")}
        >
          Women's Collection
        </button>
      </div>

      <div className={styles.copy}>
        <p className={styles.copyText}>
          ©{year} UNIQ Gallery curated with intentionality
        </p>
      </div>

    </footer>
  );
};

export default Footer;