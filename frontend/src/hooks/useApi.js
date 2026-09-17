import { useState, useCallback } from 'react';
import { supabase } from '../config/supabase';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const fetchWithAuth = useCallback(async (path, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getHeaders();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const url = `${apiUrl}${path}`;
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {

          window.location.href = '/login';
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `API Error: ${response.status}`);
      }

      if (response.status === 204) return null;
      
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const apiGet = useCallback((path) => fetchWithAuth(path, { method: 'GET' }), [fetchWithAuth]);
  
  const apiPost = useCallback((path, body) => 
    fetchWithAuth(path, { method: 'POST', body: JSON.stringify(body) }), 
  [fetchWithAuth]);
  
  const apiPut = useCallback((path, body) => 
    fetchWithAuth(path, { method: 'PUT', body: JSON.stringify(body) }), 
  [fetchWithAuth]);
  
  const apiDelete = useCallback((path) => fetchWithAuth(path, { method: 'DELETE' }), [fetchWithAuth]);

  return { apiGet, apiPost, apiPut, apiDelete, loading, error };
};
