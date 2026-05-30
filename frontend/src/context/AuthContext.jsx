import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // Proactively verify the token with backend
          const freshUser = await authAPI.getMe();
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        } catch (error) {
          console.error("Session bootstrap failed, logging out", error);
          logout();
        }
      }
      setLoading(false);
    };
    bootstrapAuth();
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const data = await authAPI.login(username, password);
      const userPayload = {
        username: data.username,
        role: data.role,
        agency_name: data.agency_name,
      };
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(userPayload));
      setUser(userPayload);
      return userPayload;
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password, role, agencyName) => {
    setLoading(true);
    try {
      const freshUser = await authAPI.register({
        username,
        email,
        password,
        role,
        agency_name: agencyName,
      });
      return freshUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
