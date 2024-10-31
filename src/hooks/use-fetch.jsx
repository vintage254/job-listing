import { useState } from 'react';

const useFetch = (fn) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = async (...args) => {
    try {
      setLoading(true);
      setError(null);
      // If first argument is an object and has an id property, use that directly
      const params = args[0];
      const actualParams = typeof params === 'object' && params.id ? params.id : args[0];
      const result = await fn(actualParams);
      setData(result);
      return result;
    } catch (error) {
      setError(error);
      console.error('Error in useFetch:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    data,
    fn: execute
  };
};

export default useFetch; 