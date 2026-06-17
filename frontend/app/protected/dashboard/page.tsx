"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useLeaves } from "@/lib/hooks/useApi";
import { Leave } from "@/types";
import Link from "next/link";

export default function DashboardPage() {
	const { user } = useAuth();
	const { leaves: rawLeaves, isLoading } = useLeaves();

	// API returns snake_case; map to camelCase to match the Leave type
	const leaves: Leave[] = (rawLeaves ?? []).map((l: any) => ({
		...l,
		startDate: l.startDate ?? l.start_date,
		endDate: l.endDate ?? l.end_date,
	}));

	const getStatusColor = (status: string) => {
		switch (status) {
			case "Approved":
				return "bg-green-100 text-green-800";
			case "Rejected":
				return "bg-red-100 text-red-800";
			default:
				return "bg-yellow-100 text-yellow-800";
		}
	};

	const formatDate = (date: string) => {
		if (!date) return "—";
		// Parse YYYY-MM-DD safely without UTC shift
		const [year, month, day] = date.split("T")[0].split("-").map(Number);
		const d = new Date(year, month - 1, day);
		if (isNaN(d.getTime())) return "—";
		return d.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};


	return (
		<div className="max-w-6xl mx-auto">
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-gray-800 mb-2">
					Welcome, {user?.name}!
				</h1>
				<p className="text-gray-600">
					Here&apos;s your leave information
				</p>
			</div>

			{user?.role === "employee" && (
				<div className="mb-6">
					<Link
						href="/protected/apply-leave"
						className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition"
					>
						Apply for Leave
					</Link>
				</div>
			)}

			<div className="bg-white rounded-lg shadow-md overflow-hidden">
				<div className="p-6 border-b border-gray-200">
					<h2 className="text-xl font-semibold text-gray-800">
						Leave Requests
					</h2>
				</div>

				{isLoading ? (
					<div className="p-6 text-center">
						<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
						<p className="mt-4 text-gray-600">
							Loading leave requests...
						</p>
					</div>
				) : leaves.length === 0 ? (
					<div className="p-6 text-center text-gray-600">
						No leave requests found.
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="bg-gray-50 border-b border-gray-200">
								<tr>
									<th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
										Start Date
									</th>
									<th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
										End Date
									</th>
									<th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
										Type
									</th>
									<th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
										Reason
									</th>
									<th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
										Status
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-200">
								{leaves.map((leave: Leave) => (
									<tr
										key={leave.id}
										className="hover:bg-gray-50 transition"
									>
										<td className="px-6 py-4 text-sm text-gray-800">
											{formatDate(leave.startDate)}
										</td>
										<td className="px-6 py-4 text-sm text-gray-800">
											{formatDate(leave.endDate)}
										</td>
										<td className="px-6 py-4 text-sm text-gray-800">
											{leave.type}
										</td>
										<td className="px-6 py-4 text-sm text-gray-800">
											{leave.reason}
										</td>
										<td className="px-6 py-4">
											<span
												className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(leave.status)}`}
											>
												{leave.status}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}
