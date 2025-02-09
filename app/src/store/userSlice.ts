import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserState } from '../types/chat';

const initialState: UserState = {
  isAuthenticated: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ userId: string; email: string }>) => {
      state.isAuthenticated = true;
      state.userId = action.payload.userId;
      state.email = action.payload.email;
    },
    clearUser: (state) => {
      state.isAuthenticated = false;
      state.userId = undefined;
      state.email = undefined;
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer; 