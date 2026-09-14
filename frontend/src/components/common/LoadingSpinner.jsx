function LoadingSpinner({ size = "medium" }) {
  const sizes = {
    small: "h-4 w-4",
    medium: "h-6 w-6",
    large: "h-8 w-8",
  };

  return (
    <div
      className={`${sizes[size]} animate-spin rounded-full border-2 border-slate-200 border-t-slate-800`}
    />
  );
}

export default LoadingSpinner;