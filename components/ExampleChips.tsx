export const EXAMPLE_REQUESTS = [
  "Launch the GLP-1 campaign push in October",
  "Hire 5 new coaches ahead of Q1",
  "Ship the new streak feature to all users",
  "Send a push notification blast for the new pricing tier",
];

export default function ExampleChips({
  onSelect,
  disabled,
}: {
  onSelect: (request: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {EXAMPLE_REQUESTS.map((example) => (
        <button
          key={example}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(example)}
          className="rounded-full border border-teal-200 bg-white px-4 py-2 text-xs font-medium text-teal-700 shadow-sm transition hover:border-teal-400 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {example}
        </button>
      ))}
    </div>
  );
}
