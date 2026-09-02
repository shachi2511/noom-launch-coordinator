export default function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="animate-fade-in flex items-start gap-3 rounded-xl2 border border-coral-300 bg-coral-100 p-4 text-sm text-coral-700">
      <span className="text-lg" aria-hidden>
        🙈
      </span>
      <div>
        <p className="font-semibold">Something didn&apos;t go through.</p>
        <p className="mt-0.5 text-coral-700/90">{message}</p>
      </div>
    </div>
  );
}
