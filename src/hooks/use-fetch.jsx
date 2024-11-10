import { useState } from 'react';

const useFetch = (fn) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = async (...args) => {
    try {
      setLoading(true);
      setError(null);
      
      // If the last argument is a function (getToken), call it to get the token
      const lastArg = args[args.length - 1];
      const token = typeof lastArg === 'function' ? await lastArg() : args[args.length - 1];
      
      // Remove the token from args if it was a function
      const fnArgs = typeof lastArg === 'function' ? args.slice(0, -1) : args;
      
      const result = await fn(...fnArgs, token);
      setData(result);
      return result;
    } catch (error) {
      console.error('Error in useFetch:', error);
      setError(error);
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