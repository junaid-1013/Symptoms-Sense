import axios from "axios";
import { RefreshTokenApi } from "@/endPoints/auth.endPoints";
import { tokenBridge } from "@/lib/tokenBridge";
import { toast } from "@/components/ui/use-toast";
import { STORAGE_KEYS } from "@/config/localStorageKeys";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = tokenBridge.getAccessToken();
    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {

    const originalRequest = error.config;

    if (!error.response) {
      return Promise.reject({ message: "Network error" });
    }

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = tokenBridge.getRefreshToken();

      if (!refreshToken) {
        handleSessionExpired();
        return Promise.reject(error);
      }

      return RefreshTokenApi(refreshToken)
        .then((res) => {
          const { access_token, refresh_token } = res.data.data;

          tokenBridge.setTokens(access_token, refresh_token);
          localStorage.setItem(STORAGE_KEYS.tokens, JSON.stringify({
          accessToken: access_token,
          refreshToken: refresh_token
        }));

          originalRequest.headers["Authorization"] = `Bearer ${access_token}`;

          return axiosInstance(originalRequest);
        })
        .catch((err) => {
          handleSessionExpired();
          return Promise.reject(err);
        });
    }
    return Promise.reject(error);
  }
);

function handleSessionExpired() {
  tokenBridge.logout();

  toast({
    title: "Session Expired",
    description: "Your session has expired. Please login again.",
    variant: "destructive",
  });

  window.location.href = "/login";
}

export default axiosInstance;