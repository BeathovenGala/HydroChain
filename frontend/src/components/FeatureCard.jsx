// src/components/ui/homepages/FeatureCard.jsx
import React from "react";

export default function FeatureCard({ title, children, icon }) {
  return (
    <div className="p-5 rounded-xl transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl card-3d">
      <div className="flex gap-3 items-start">
        <div className="w-10 h-10 rounded-md bg-emerald-50 flex items-center justify-center">
          {icon ?? (
            <svg width="16" height="16" viewBox="0 0 24 24" className="text-emerald-600">
              <path d="M12 2v20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          )}
        </div>
        <div>
          <h5 className="font-medium text-slate-900">{title}</h5>
          <p className="mt-2 text-sm text-slate-500">{children}</p>
        </div>
      </div>
    </div>
  );
}
