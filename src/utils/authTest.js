// Test utility to verify cookie authentication
import { setAuthCookies, getAuthCookies, clearAuthCookies } from './cookies';

export const testCookieAuth = () => {
  console.log('Testing cookie authentication...');
  
  // Test data
  const testToken = 'test-jwt-token-123';
  const testUser = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user'
  };
  
  // Test setting cookies
  setAuthCookies(testToken, testUser);
  console.log('✓ Cookies set');
  
  // Test getting cookies
  const { token, user } = getAuthCookies();
  console.log('Retrieved token:', token);
  console.log('Retrieved user:', user);
  
  // Verify data integrity
  if (token === testToken && user.email === testUser.email) {
    console.log('✓ Cookie data integrity verified');
  } else {
    console.log('✗ Cookie data integrity failed');
  }
  
  // Test clearing cookies
  clearAuthCookies();
  const { token: clearedToken, user: clearedUser } = getAuthCookies();
  
  if (!clearedToken && !clearedUser) {
    console.log('✓ Cookies cleared successfully');
  } else {
    console.log('✗ Cookie clearing failed');
  }
  
  console.log('Cookie authentication test completed');
};