import { useState } from "react";

export const useScenario = (scenarioFunction) => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = async (payload) => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const data = await scenarioFunction(payload);

      setResult(data);

      return data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Something went wrong while running the scenario.";

      setError(message);

      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setLoading(false);
  };

  return {
    result,
    loading,
    error,
    run,
    reset,
  };
};