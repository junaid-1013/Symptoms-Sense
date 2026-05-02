let accessToken: string | null = null;
let refreshToken: string | null = null;
let logoutHandler: (() => void) | null = null;

export const tokenBridge = {
  setTokens: (access: string | null, refresh: string | null) => {
    accessToken = access;
    refreshToken = refresh;
  },
  getAccessToken: () => accessToken,
  getRefreshToken: () => refreshToken,
  setLogoutHandler: (fn: () => void) => { logoutHandler = fn },
  logout: () => {
  accessToken = null;
  refreshToken = null;

  localStorage.clear(); 

  if (logoutHandler) logoutHandler();
}
};