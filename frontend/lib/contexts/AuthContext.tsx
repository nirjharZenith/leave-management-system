"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/types";

interface AuthContextType {
	user: User | null;
	loading: boolean;
	login: (email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
	isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		checkAuth();
	}, []);

	const checkAuth = async () => {
		try {
			const response = await fetch(`${API_URL}/api/auth/me`, {
				method: "GET",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
			});

			if (response.ok) {
				const data = await response.json();
				setUser(data.user);
			}
		} catch (error) {
			console.error("[v0] Auth check failed:", error);
			setUser(null);
		} finally {
			setLoading(false);
		}
	};

	const login = async (email: string, password: string) => {
		setLoading(true);
		try {
			const response = await fetch(`${API_URL}/api/auth/login`, {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.error || errorData.message || "Login failed",
				);
			}

			const data = await response.json();
			setUser(data.user);
		} catch (error) {
			console.error("Login fetch failed:", error);

			if (error instanceof TypeError) {
				throw new Error(
					"Cannot connect to the backend. Is http://localhost:5000 running?",
				);
			}

			throw error;
		} finally {
			setLoading(false);
		}
	};

	const logout = async () => {
		try {
			await fetch(`${API_URL}/api/auth/logout`, {
				method: "POST",
				credentials: "include",
			});
		} catch (error) {
			console.error("[v0] Logout error:", error);
		} finally {
			setUser(null);
			router.push("/login");
		}
	};

	return (
		<AuthContext.Provider
			value={{ user, loading, login, logout, isAuthenticated: !!user }}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return context;
}
