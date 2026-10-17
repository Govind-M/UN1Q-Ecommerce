
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activeGender:     "MEN",
  activeCategoryId: null,
  activeProductId:  null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setGender(state, action) {
      state.activeGender = action.payload;
    },
    setCategory(state, action) {
      state.activeCategoryId = action.payload.categoryId;
      state.activeGender     = action.payload.gender;
      state.activeProductId  = null;
    },
    setProduct(state, action) {
      state.activeCategoryId = action.payload.categoryId;
      state.activeProductId  = action.payload.productId;
    },
    clearProduct(state) {
      state.activeProductId = null;
    },
  },
});

export const { setGender, setCategory, setProduct, clearProduct } = uiSlice.actions;


export const selectActiveCategoryId = (state) => state.ui.activeCategoryId;
export const selectActiveProductId  = (state) => state.ui.activeProductId;

export default uiSlice.reducer;