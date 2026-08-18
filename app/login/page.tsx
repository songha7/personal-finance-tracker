"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

const LoginPage = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
    });

    setIsSubmitting(false);

    if (signInError) {
      setError(signInError.message ?? "Something went wrong");
      return;
    }

    router.push("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-(--chart-grid) bg-(--surface-card) p-6 shadow-sm"
      >
        <h1 className="mb-2 text-2xl font-semibold text-(--ink-primary)">Log in</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-(--chart-grid) px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-(--brand-500)"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-(--chart-grid) px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-(--brand-500)"
        />

        {error && <p className="text-sm text-(--status-critical)">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded-md bg-(--brand-600) px-3 py-2 text-sm font-medium text-white hover:bg-(--brand-700) disabled:opacity-50"
        >
          {isSubmitting ? "Logging in..." : "Log in"}
        </button>

        <p className="text-center text-sm text-(--ink-muted)">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-(--brand-600) underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
