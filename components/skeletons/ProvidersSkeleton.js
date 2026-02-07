export default function ProvidersSkeleton() {
  return (
    <div className="mt-8">
      <div className="h-6 w-40 bg-gray-700 rounded mb-4 skeleton-shimmer"></div>
      <div className="flex gap-3 flex-wrap">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="w-12 h-12 rounded-lg bg-gray-700 skeleton-shimmer"
          ></div>
        ))}
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
