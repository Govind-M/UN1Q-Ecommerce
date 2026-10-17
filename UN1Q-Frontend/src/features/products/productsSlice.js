import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import {
  fetchProductsByCategory,
  fetchProductById,
  fetchFilters,
} from "../../services/categoryApi";

export const loadAllProducts = createAsyncThunk(
  "products/loadAllProducts",
  async (categoryId, { rejectWithValue }) => {
    try {
      const data = await fetchProductsByCategory(categoryId);
      return { categoryId, products: data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const loadSingleProduct = createAsyncThunk(
  "products/loadSingleProduct",
  async ({ categoryId, productId }, { rejectWithValue }) => {
    try {
      const data = await fetchProductById(categoryId, productId);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const loadFilters = createAsyncThunk(
  "products/loadFilters",
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchFilters();
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

const initialState = {
  items: [],
  loadedCategoryId: null,
  listingStatus: "idle",
  listingError: null,

  activeProduct: null,
  detailStatus: "idle",
  detailError: null,

  filters: {},
  filtersStatus: "idle",
};

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    clearActiveProduct(state) {
      state.activeProduct = null;
      state.detailStatus = "idle";
      state.detailError = null;
    },

    clearListing(state) {
      state.items = [];
      state.listingStatus = "idle";
      state.listingError = null;
      state.loadedCategoryId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadAllProducts.pending, (state) => {
        state.listingStatus = "loading";
        state.listingError = null;
      })
      .addCase(loadAllProducts.fulfilled, (state, action) => {
        state.listingStatus = "succeeded";
        state.items = action.payload.products;
        state.loadedCategoryId = action.payload.categoryId;
      })
      .addCase(loadAllProducts.rejected, (state, action) => {
        state.listingStatus = "failed";
        state.listingError = action.payload;
      });

    builder
      .addCase(loadSingleProduct.pending, (state) => {
        state.detailStatus = "loading";
        state.detailError = null;
        state.activeProduct = null;
      })
      .addCase(loadSingleProduct.fulfilled, (state, action) => {
        state.detailStatus = "succeeded";
        state.activeProduct = action.payload;
      })
      .addCase(loadSingleProduct.rejected, (state, action) => {
        state.detailStatus = "failed";
        state.detailError = action.payload;
      });

    builder
      .addCase(loadFilters.pending, (state) => {
        state.filtersStatus = "loading";
      })
      .addCase(loadFilters.fulfilled, (state, action) => {
        state.filtersStatus = "succeeded";
        state.filters = action.payload;
      })
      .addCase(loadFilters.rejected, (state) => {
        state.filtersStatus = "failed";
      });
  },
});

export const { clearActiveProduct, clearListing } = productsSlice.actions;
export default productsSlice.reducer;
