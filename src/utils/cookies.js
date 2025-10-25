// Cookie utility functions
export const setCookie = (name, value, days = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

export const getCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const deleteCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

export const setAuthCookies = (token, user) => {
  setCookie('authToken', token, 7);
  setCookie('userData', JSON.stringify(user), 7);
};

export const getAuthCookies = () => {
  const token = getCookie('authToken');
  const userData = getCookie('userData');
  return {
    token,
    user: userData ? JSON.parse(userData) : null
  };
};

export const clearAuthCookies = () => {
  deleteCookie('authToken');
  deleteCookie('userData');
};