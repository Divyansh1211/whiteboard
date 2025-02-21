"use client";

import { useRouter } from "next/navigation";
import { AuthLayout } from "../../../components/AuthLayout";
import { useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../config";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/auth/login`, {
        email,
        password,
      });
      if (res.status === 200) {
        localStorage.setItem("token", `Bearer ${res.data.token}`);
        localStorage.setItem("userId", res.data.user.id);
        router.push("/gallery");
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.response.data.message);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to access your drawings">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="flex justify-center text-center text-sm text-gray-600">
          Don't have an account?&nbsp;
          <div
            onClick={() => router.push("/signup")}
            className=" font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer"
          >
            Sign up
          </div>
        </p>
      </form>
    </AuthLayout>
  );
}
