import { useState } from "react";

const useFetch = (fn, params = {}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const execute = async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fn(params, ...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      console.error("Error in useFetch:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    data,
    error,
    fn: execute,
  };
};

export default useFetch; 