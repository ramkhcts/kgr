export function KarthikLLCLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="#0f4c81" />
      <polygon points="20,5 32,12 32,28 20,35 8,28 8,12" fill="none" stroke="#f0c040" strokeWidth="1.5" />
      <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle"
        fill="#f0c040" fontSize="7" fontWeight="800" fontFamily="Arial, sans-serif" letterSpacing="0.3">
        KLLC
      </text>
    </svg>
  );
}
