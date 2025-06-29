export default function ErrorAlert({ error, clearError }) {
  if (!error) return null;
  return (
    <div className="error-toast">
      <p className="error-toast-message">{error}</p>
      <button className="error-toast-close" onClick={clearError}>×</button>
    </div>
  );
}