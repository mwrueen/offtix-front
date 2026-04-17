// Cookie utility functions
export const setCookie = (name, value, days = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

export const getCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      const value = c.substring(nameEQ.length, c.length);
      try {
        return decodeURIComponent(value);
      } catch (e) {
        return value;
      }
    }
  }
  return null;
};

export const deleteCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

export const setAuthCookies = (token, user) => {
  setCookie('authToken', token, 7);
  // Store only essential user data in cookies to avoid size limits
  const profilePic = user.profilePicture || user.profile?.profilePicture || user.avatar;
  const essentialUser = {
    id: user.id || user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profilePicture: (profilePic && profilePic.startsWith('data:')) ? null : profilePic
  };
  setCookie('userData', JSON.stringify(essentialUser), 7);
};

export const getAuthCookies = () => {
  const token = getCookie('authToken');
  const userData = getCookie('userData');
  let user = null;

  if (userData) {
    try {
      user = JSON.parse(userData);
    } catch (error) {
      console.error('Failed to parse userData cookie:', error);
      // If cookie is corrupted, clear it to prevent repeated errors
      clearAuthCookies();
    }
  }

  return {
    token,
    user
  };
};

export const clearAuthCookies = () => {
  deleteCookie('authToken');
  deleteCookie('userData');
};