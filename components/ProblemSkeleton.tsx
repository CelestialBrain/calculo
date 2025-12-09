import React from 'react';

const ProblemSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-pulse pb-12">
      {/* Problem Card Skeleton */}
      <div className="bg-slate-100 rounded-2xl p-10 border border-slate-200">
        <div className="flex items-center gap-3 mb-8 border-b border-slate-200 pb-5">
          <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
          <div className="h-7 bg-slate-200 rounded-lg w-48"></div>
        </div>
        
        <div className="space-y-4">
          <div className="h-6 bg-slate-200 rounded-lg w-3/4"></div>
          <div className="h-6 bg-slate-200 rounded-lg w-full"></div>
          <div className="h-6 bg-slate-200 rounded-lg w-5/6"></div>
          <div className="h-6 bg-slate-200 rounded-lg w-4/6"></div>
        </div>
        
        <div className="mt-8 space-y-3">
          <div className="h-4 bg-slate-200 rounded w-2/3"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>

      {/* Difficulty Analysis Skeleton */}
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-6 flex gap-5 items-start mx-2">
        <div className="shrink-0 w-10 h-10 bg-slate-200 rounded-full"></div>
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-slate-200 rounded w-32"></div>
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-5/6"></div>
        </div>
      </div>

      {/* Solution Preview Skeleton */}
      <div className="bg-slate-100 rounded-2xl p-10">
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-200">
          <div className="w-9 h-9 bg-slate-200 rounded-lg"></div>
          <div className="h-6 bg-slate-200 rounded w-56"></div>
        </div>
        
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-5 bg-slate-200 rounded w-32"></div>
              <div className="h-4 bg-slate-200 rounded w-full"></div>
              <div className="h-4 bg-slate-200 rounded w-4/5"></div>
              <div className="h-24 bg-slate-200 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProblemSkeleton;
