import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1/',
  headers: {
    'Content-Type': 'application/json',
  },
})


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    const guestToken = localStorage.getItem('guest_cart_token')
    if (guestToken && !token) {
      config.headers['X-Cart-Token'] = guestToken
    }

    return config
  },
  (error) => Promise.reject(error)
)


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail || '';
    const isBlockedError =
      status === 401 &&
      detail.toLowerCase().includes('blocked');
    if (isBlockedError) {
      import('../app/store').then(({ store }) => {
        import('../features/auth/authSlice').then(({ forceLogoutBlocked }) => {
          store.dispatch(forceLogoutBlocked());
          window.location.replace('/blocked');
        });
      });
    }
    return Promise.reject(error);
  },
);
export default api;

