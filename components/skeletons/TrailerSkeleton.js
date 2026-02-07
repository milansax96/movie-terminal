export default function TrailerSkeleton() {
  return (
    <div className="mt-8">
      <div className="h-6 w-32 bg-gray-700 rounded mb-4 skeleton-shimmer"></div>
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <div className="absolute inset-0 bg-gray-700 rounded-lg skeleton-shimmer flex items-center justify-center">
          <svg
            className="w-16 h-16 text-gray-600"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            opacity: 0.6;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            opacity: 0.6;
          }
        }

        .skeleton-shimmer {
          animation: shimmer 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
