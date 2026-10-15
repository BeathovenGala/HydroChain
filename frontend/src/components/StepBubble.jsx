// src/components/ui/homepages/StepBubble.jsx
import React, { useState } from "react";

export default function StepBubble({ step, title, short, details, icon }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <button
        onClick={() => setOpen((s) => !s)}
        aria-expanded={open}
        aria-controls={`step-${step}`}
        className={`w-20 h-20 rounded-full flex items-center justify-center transition-transform duration-300 ${
          open ? "scale-105 shadow-2xl bg-white" : "hover:-translate-y-1 hover:scale-105 bg-white/95"
        }`}
        type="button"
      >
        <div className="flex flex-col items-center">
          <div className="text-sm font-bold text-emerald-700">{step}</div>
          <div className="mt-1 text-emerald-500">{icon ?? "⚡"}</div>
        </div>
      </button>

      <div className="max-w-xs">
        <h6 className="font-semibold text-slate-900">{title}</h6>
        <p className="text-sm text-slate-500">{short}</p>

        {open && (
          <div id={`step-${step}`} className="mt-3 p-3 rounded-lg bg-white shadow card-3d text-sm text-slate-800">
            {details}
          </div>
        )}
      </div>
    </div>
  );
}
