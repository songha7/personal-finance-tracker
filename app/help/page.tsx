"use client";

// The sidebar has always linked to /help; this page just needs to exist so
// that link goes somewhere instead of 404ing.

const FAQ = [
  {
    q: "How do I record a transaction?",
    a: "Go to Add transaction in the sidebar, fill in the description, category, amount, and date, then save. It's added to your account immediately.",
  },
  {
    q: "How are budgets calculated?",
    a: "Each category budget is a limit you (or the app's defaults) set. The Budgets page compares that limit against everything you've logged as an expense in that category.",
  },
  {
    q: "Why does the bell icon show a dot?",
    a: "It means at least one of your categories is currently over its budget limit — click it to see which ones.",
  },
  {
    q: "Is my data shared with other accounts?",
    a: "No — every transaction and budget is tied to your user id and only ever queried for the account you're signed into.",
  },
];

const HelpPage = () => {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-(--ink-primary)">Help & support</h1>
        <p className="text-sm text-(--ink-muted)">Answers to a few common questions.</p>
      </div>

      <div className="flex max-w-2xl flex-col gap-3">
        {FAQ.map(({ q, a }) => (
          <div
            key={q}
            className="rounded-2xl border border-(--chart-grid) bg-(--surface-card) p-4"
          >
            <p className="font-medium text-(--ink-primary)">{q}</p>
            <p className="mt-1 text-sm text-(--ink-secondary)">{a}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HelpPage;
