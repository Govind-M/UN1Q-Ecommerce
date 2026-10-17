import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setCategory } from "../features/ui/uiSlice";
import styles from "../styles/HeroCarousel.module.css";

const SLIDES = {
  MEN: [
    {
      id: "men-topwear-slide",
      categoryId: "men_topwear",
      eyebrow: "SUMMER COLLECTION '26",
      title: "Tops That\nSpeak First",
      cta: "Explore Topwear",
      image:
        "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=1200&q=80",
    },
    {
      id: "men-bottomwear-slide",
      categoryId: "men_bottomwear",
      eyebrow: "NEW ARRIVALS",
      title: "Bottoms Built\nto Last",
      cta: "Explore Bottomwear",
      image:
        "https://images.unsplash.com/photo-1542272604-787c3835535d?w=1200&q=80",
    },
    {
      id: "men-shoes-slide",
      categoryId: "men_shoes",
      eyebrow: "FOOTWEAR '26",
      title: "Every Step\nIn Style",
      cta: "Explore Shoes",
      image:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80",
    },
    {
      id: "bags-slide-men",
      categoryId: "bags",
      eyebrow: "CARRY IN CONFIDENCE",
      title: "Bags That\nMean Business",
      cta: "Explore Bags",
      image:
        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1200&q=80",
    },
  ],
  WOMEN: [
    {
      id: "women-topwear-slide",
      categoryId: "women_topwear",
      eyebrow: "SUMMER COLLECTION '26",
      title: "Effortless\nElegance",
      cta: "Explore Topwear",
      image:
        "https://images.unsplash.com/photo-1541101767792-f9b2b1c4f127?w=1200&q=80",
    },

    {
      id: "women-bottomwear-slide",
      categoryId: "women_bottomwear",
      eyebrow: "NEW ARRIVALS",
      title: "The New\nSilhouette",
      cta: "Explore Bottomwear",
      image:
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=80",
    },
    {
      id: "women-shoes-slide",
      categoryId: "women_shoes",
      eyebrow: "FOOTWEAR '26",
      title: "Walk Into\nYour Season",
      cta: "Explore Shoes",
      image:
        "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1200&q=80",
    },
    {
      id: "bags-slide-women",
      categoryId: "bags",
      eyebrow: "CARRY IN STYLE",
      title: "Bags That\nComplete You",
      cta: "Explore Bags",
      image:
        "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1200&q=80",
    },
  ],
};

const AUTOPLAY_INTERVAL = 4000;

const HeroCarousel = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const activeGender = useSelector((state) => state.ui.activeGender);

  const slides = SLIDES[activeGender] ?? SLIDES.MEN;

  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const advance = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(advance, AUTOPLAY_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [advance, paused]);

  useEffect(() => {
    setCurrent(0);
  }, [activeGender]);

  const goTo = (index) => {
    setCurrent(index);
    clearInterval(timerRef.current);
  };

  const goPrev = () => {
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
    clearInterval(timerRef.current);
  };

  const goNext = () => {
    setCurrent((c) => (c + 1) % slides.length);
    clearInterval(timerRef.current);
  };

  const handleExplore = (slide) => {
    dispatch(
      setCategory({ categoryId: slide.categoryId, gender: activeGender }),
    );
    navigate(`/products/${slide.categoryId}`);
  };

  return (
    <div
      className={styles.carousel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={styles.track}>
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={`${styles.slide} ${i === current ? styles.slideActive : styles.slideHidden}`}
            aria-hidden={i !== current}
          >
            <img
              src={s.image}
              alt={s.title.replace("\n", " ")}
              className={styles.slideImg}
            />
            <div className={styles.overlay} />
            <div className={styles.content}>
              <p className={styles.eyebrow}>{s.eyebrow}</p>
              <h2 className={styles.title}>
                {s.title.split("\n").map((line, li) => (
                  <span key={li} className={styles.titleLine}>
                    {line}
                  </span>
                ))}
              </h2>
              <button
                className={styles.ctaBtn}
                onClick={() => handleExplore(s)}
              >
                {s.cta} →
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.controls}>
        <div className={styles.dots}>
          {slides.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === current ? styles.dotActive : ""}`}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
        <div className={styles.arrows}>
          <button
            className={styles.arrow}
            onClick={goPrev}
            aria-label="Previous"
          >
            ←
          </button>
          <button className={styles.arrow} onClick={goNext} aria-label="Next">
            →
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroCarousel;
