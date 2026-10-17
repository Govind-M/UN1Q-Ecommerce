import api from "./axiosInstance";

export const CATEGORY_ENDPOINT_MAP = {
  men_topwear:     "/men_topwear",
  men_bottomwear:  "/men_bottomwear",
  men_shoes:       "/men_shoes",

  women_topwear:   "/women_topwear",
  women_bottomwear:"/women_bottomwear",
  women_shoes:     "/women_shoes",

  bags:            "/bags",
  caps:            "/caps",
};

export const CATEGORIES = [
  {
    id: "men_topwear",
    label: "Topwear",
    gender: "men",
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80",
  },
  {
    id: "men_bottomwear",
    label: "Bottomwear",
    gender: "men",
    image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=80",
  },
  {
    id: "men_shoes",
    label: "Shoes",
    gender: "men",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
  },
  {
    id: "women_topwear",
    label: "Topwear",
    gender: "women",
    image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&q=80",
  },
  {
    id: "women_bottomwear",
    label: "Bottomwear",
    gender: "women",
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80",
  },
  {
    id: "women_shoes",
    label: "Shoes",
    gender: "women",
    image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80",
  },
  {
    id: "bags",
    label: "Bags",
    gender: "unisex",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
  },
  {
    id: "caps",
    label: "Caps",
    gender: "unisex",
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80",
  },
];

export const fetchProductsByCategory = async (categoryId, params = {}) => {
  const searchParams = {
    category: categoryId,
    ...params,
  };
  const { data } = await api.get("/catalog/products/", { params: searchParams });
  return data.results || data;
};

// Backend Search API Helper
export const searchProductsApi = async (query) => {
  if (!query || !query.trim()) return [];
  try {
    const { data } = await api.get("/catalog/products/", {
      params: { search: query.trim() },
    });
    return data.results || data;
  } catch (error) {
    console.error("Backend search failed:", error);
    return [];
  }
};

export const fetchProductById = async (categoryId, productId) => {
  const targetId = productId || categoryId;
  const { data } = await api.get(`/catalog/products/${targetId}/`);
  return data;
};

export const fetchFilters = async () => {
  try {
    const { data } = await api.get("/catalog/filters/");
    return data;
  } catch (err) {
    return {};
  }
};
