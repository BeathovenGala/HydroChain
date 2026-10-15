// src/components/ui/homepages/InfoCard.jsx
import React from "react";

export default function InfoCard({ title, children, icon }) {
  return (
    <article className="p-6 rounded-2xl transform transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl card-3d">
      <div className="flex gap-4 items-start">
        <div className="w-12 h-12 rounded-lg bg-white/6 flex items-center justify-center">
          {icon ?? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-emerald-500">
              <path d="M12 2v20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          )}
        </div>
        <div>
          <h4 className="font-semibold text-lg text-slate-900">{title}</h4>
          <p className="mt-2 text-sm text-slate-600">{children}</p>
        </div>
      </div>
    </article>
  );
}
