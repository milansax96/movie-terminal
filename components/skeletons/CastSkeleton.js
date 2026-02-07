export default function CastSkeleton() {
  return (
    <div className="mt-8">
      <div className="h-6 w-24 bg-gray-700 rounded mb-4 skeleton-shimmer"></div>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="flex flex-col items-center min-w-[120px]">
            <div className="w-24 h-24 rounded-full bg-gray-700 mb-2 skeleton-shimmer"></div>
            <div className="h-4 w-20 bg-gray-700 rounded skeleton-shimmer"></div>
          </div>
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

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
