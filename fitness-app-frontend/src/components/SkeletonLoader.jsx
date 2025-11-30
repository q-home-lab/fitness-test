import React from 'react';

/**
 * Componente de skeleton loader reutilizable
 */
export const SkeletonBox = ({ className = '', width = '100%', height = '1rem' }) => (
  <div
    className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`}
    style={{ width, height }}
    aria-hidden="true"
  />
);

export const SkeletonCard = () => (
  <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
    <SkeletonBox height="1.5rem" width="60%" className="mb-4" />
    <SkeletonBox height="1rem" className="mb-2" />
    <SkeletonBox height="1rem" width="80%" />
  </div>
);

export const SkeletonChart = () => (
  <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
    <SkeletonBox height="1.5rem" width="40%" className="mb-6" />
    <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
  </div>
);

export const SkeletonList = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <SkeletonBox width="4rem" height="4rem" className="rounded-lg" />
        <div className="flex-1 space-y-2">
          <SkeletonBox height="1rem" width="60%" />
          <SkeletonBox height="0.75rem" width="40%" />
        </div>
      </div>
    ))}
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
    <SkeletonChart />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SkeletonCard />
      <SkeletonCard />
    </div>
  </div>
);

// Export default para compatibilidad
const SkeletonLoader = {
  SkeletonBox,
  SkeletonCard,
  SkeletonChart,
  SkeletonList,
  DashboardSkeleton,
};

export default SkeletonLoader;

