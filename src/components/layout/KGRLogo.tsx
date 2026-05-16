export function KGRLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2L36 11V29L20 38L4 29V11L20 2Z" fill="#1a1f5e" stroke="#d4a017" strokeWidth="1.5" />
      <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle"
        fill="#d4a017" fontSize="11" fontWeight="800" fontFamily="Arial, sans-serif" letterSpacing="0.5">
        KGR
      </text>
    </svg>
  );
}
