import Navbar from "../components/Navbar";
import CategoriesSection from "../components/CategoriesSection";
import { setGender } from "../features/ui/uiSlice";
import { useSelector, useDispatch } from "react-redux";
import HeroCarousel from "../components/HeroCarousel";
import PerksBar from "../components/PerksBar";
import Footer from "../components/Footer";

export default function Home() {
  const category = useSelector((state) => state.ui.activeGender);
  const dispatch = useDispatch()
  return (
    <>
      <Navbar
        activeCategory={category}
        onCategoryChange={(cat) => dispatch(setGender(cat))}
        onSearch={(val) => console.log("search:", val)}
      />
      <HeroCarousel/>
      <PerksBar/>
      <CategoriesSection />
      <Footer/>
    </>
  );
}
