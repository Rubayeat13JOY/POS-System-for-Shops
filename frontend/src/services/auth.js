// Decode JWT token to get user info (without needing a library)
export const getUserFromToken = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
  
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded; // { id, role, iat, exp }
    } catch (error) {
      return null;
    }
  };
  
  export const isAdmin = () => {
    const user = getUserFromToken();
    return user?.role === 'admin';
  };
  
  export const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  };