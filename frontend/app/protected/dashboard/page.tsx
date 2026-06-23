"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useLeaves } from "@/lib/hooks/useApi";
import { formatDate, getStatusColor, mapLeave } from "@/lib/utils/format";
import Link from "next/link";
import { Calendar, CheckCircle, Clock, XCircle, CalendarPlus } from "lucide-react";

export default function DashboardPage() {
	const { user } = useAuth();
	const { leaves: rawLeaves, isLoading } = useLeaves();

	const leaves = (rawLeaves ?? []).map((l: Record<string, unknown>) => mapLeave(l));

	const pending = leaves.filter((l: any) => l.status === "Pending").length;
	const approved = leaves.filter((l: any) => l.status === "Approved").length;
	const rejected = leaves.filter((l: any) => l.status === "Rejected").length;

	const stats = [
		{ label: "Pending", value: pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
		{ label: "Approved", value: approved, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
		{ label: "Rejected", value: rejected, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
	];

	return (
		<div className="max-w-6xl mx-auto">
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-gray-900 mb-1">
					Welcome back, {user?.name}!
				</h1>
				<p className="text-gray-600 capitalize">
					{user?.role} dashboard — manage your leave requests
				</p>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
				{stats.map((stat) => {
					const Icon = stat.icon;
					return (
						<div
							key={stat.label}
							className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-4"
						>
							<div className={`p-3 rounded-lg ${stat.bg}`}>
								<Icon className={`w-5 h-5 ${stat.color}`} />
							</div>
							<div>
								<p className="text-sm text-gray-500">{stat.label}</p>
								<p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
							</div>
						</div>
					);
				})}
			</div>

			{user?.role === "employee" && (
				<div className="mb-6">
					<Link
						href="/protected/apply-leave"
						className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-lg transition shadow-sm"
					>
						<CalendarPlus className="w-4 h-4" />
						Apply for Leave
					</Link>
				</div>
			)}

			{user?.role === "manager" && (
				<div className="mb-6 flex flex-wrap gap-3">
					<Link
						href="/protected/manager/approvals"
						className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-6 rounded-lg transition shadow-sm"
					>
						<CheckCircle className="w-4 h-4" />
						Review Approvals
						{pending > 0 && (
							<span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
								{pending}
							</span>
						)}
					</Link>
					<Link
						href="/protected/manager/employees"
						className="inline-flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 px-6 rounded-lg transition"
					>
						Manage Team
					</Link>
				</div>
			)}

			<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
				<div className="p-6 border-b border-gray-100 flex items-center gap-3">
					<Calendar className="w-5 h-5 text-indigo-600" />
					<h2 className="text-lg font-semibold text-gray-900">Leave Requests</h2>
				</div>

				{isLoading ? (
					<div className="p-12 text-center">
						<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
						<p className="mt-4 text-gray-500">Loading leave requests...</p>
					</div>
				) : leaves.length === 0 ? (
					<div className="p-12 text-center text-gray-500">
						<Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
						<p className="font-medium">No leave requests yet</p>
						{user?.role === "employee" && (
							<p className="text-sm mt-1">
								<Link href="/protected/apply-leave" className="text-indigo-600 hover:underline">
									Submit your first request
								</Link>
							</p>
						)}
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="bg-gray-50/80 border-b border-gray-100">
								<tr>
									{(user?.role === "manager" || user?.role === "admin") && (
										<th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
											Employee
										</th>
									)}
									<th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
										Start Date
									</th>
									<th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
										End Date
									</th>
									<th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
										Type
									</th>
									<th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
										Reason
									</th>
									<th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
										Status
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100">
								{leaves.map((leave: any) => (
									<tr key={leave.id} className="hover:bg-gray-50/50 transition">
										{(user?.role === "manager" || user?.role === "admin") && (
											<td className="px-6 py-4 text-sm font-medium text-gray-900">
												{leave.employeeName || "—"}
											</td>
										)}
										<td className="px-6 py-4 text-sm text-gray-600">
											{formatDate(leave.startDate)}
										</td>
										<td className="px-6 py-4 text-sm text-gray-600">
											{formatDate(leave.endDate)}
										</td>
										<td className="px-6 py-4">
											<span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
												{leave.type}
											</span>
										</td>
										<td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
											{leave.reason}
										</td>
										<td className="px-6 py-4">
											<span
												className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(leave.status)}`}
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
