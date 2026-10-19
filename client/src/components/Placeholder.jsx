export default function Placeholder({ title, description, icon }) {
  return (
    <div className="card p-10 text-center">
      <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 text-xl">
        {icon || "•"}
      </div>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">{description}</p>}
      <p className="mt-4 text-xs text-slate-400">This screen will be built in an upcoming step.</p>
    </div>
  );
}
