interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showLabel?: boolean;
}

export default function CircularProgress({
  percentage,
  size = 60,
  strokeWidth = 6,
  color = '#10b981',
  showLabel = true
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage <= 20) return '#ef4444';
    if (percentage <= 40) return '#f59e0b';
    return color;
  };

  const actualColor = getColor();

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-slate-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={actualColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
          style={{
            filter: `drop-shadow(0 0 8px ${actualColor}40)`
          }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white" style={{ textShadow: '0 0 10px rgba(0,0,0,0.5)' }}>
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
}
