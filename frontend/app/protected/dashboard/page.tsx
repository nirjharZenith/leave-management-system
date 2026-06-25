"use client";

import { useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useLeaves } from "@/lib/hooks/useApi";
import { formatDate, getStatusColor, mapLeave } from "@/lib/utils/format";
import Link from "next/link";
import { Calendar, CheckCircle, Clock, XCircle, CalendarPlus, ChevronRight, Eye } from "lucide-react";
import LeaveDetailsModal from "@/components/LeaveDetailsModal";

export default function DashboardPage() {
	const { user } = useAuth();
	const { leaves: rawLeaves, isLoading } = useLeaves();
	const [selectedLeave, setSelectedLeave] = useState<any | null>(null);

	const leaves = (rawLeaves ?? []).map((l: Record<string, unknown>) => mapLeave(l));

	const pending = leaves.filter((l: any) => l.status === "Pending").length;
	const approved = leaves.filter((l: any) => l.status === "Approved").length;
	const rejected = leaves.filter((l: any) => l.status === "Rejected").length;

	const stats = [
		{ label: "Pending Requests", value: pending, icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/20" },
		{ label: "Approved Requests", value: approved, icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/20" },
		{ label: "Rejected Requests", value: rejected, icon: XCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/20" },
	];

	return (
		<div className="max-w-6xl mx-auto space-y-6">
			{/* Page Header Card */}
			<div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg border border-indigo-100/10 relative overflow-hidden">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
				<div className="relative z-10 space-y-2">
					<h1 className="text-3xl font-extrabold tracking-tight">
						Welcome back, {user?.name}!
					</h1>
					<p className="text-indigo-100 font-medium capitalize max-w-md">
						{user?.role} Portal — easily manage and track organization leave schedules.
					</p>
				</div>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				{stats.map((stat) => {
					const Icon = stat.icon;
					return (
						<div
							key={stat.label}
							className={`bg-white dark:bg-slate-900 rounded-xl border p-5 shadow-sm flex items-center gap-4 transition hover:shadow-md ${stat.bg}`}
						>
							<div className={`p-3 rounded-xl ${stat.bg.split(" ")[0]} text-current`}>
								<Icon className={`w-6 h-6 ${stat.color}`} />
							</div>
							<div>
								<p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</p>
								<p className={`text-2xl font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
							</div>
						</div>
					);
				})}
			</div>

			{/* Actions Section */}
			<div className="flex flex-wrap gap-3 items-center">
				{user?.role === "employee" && (
					<Link
						href="/protected/apply-leave"
						className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-xl transition shadow-sm hover:shadow-indigo-100 hover:translate-y-[-1px] active:translate-y-0"
					>
						<CalendarPlus className="w-4 h-4" />
						Apply for Leave
					</Link>
				)}

				{user?.role === "manager" && (
					<>
						<Link
							href="/protected/manager/approvals"
							className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-6 rounded-xl transition shadow-sm hover:shadow-emerald-100 hover:translate-y-[-1px] active:translate-y-0"
						>
							<CheckCircle className="w-4 h-4" />
							Review Approvals
							{pending > 0 && (
								<span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-bold">
									{pending}
								</span>
							)}
						</Link>
						<Link
							href="/protected/manager/employees"
							className="inline-flex items-center gap-2 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200 font-semibold py-2.5 px-6 rounded-xl transition shadow-sm"
						>
							Manage Team
						</Link>
					</>
				)}
			</div>

			{/* Leaves Table */}
			<div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
				<div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
					<div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-lg">
						<Calendar className="w-5 h-5" />
					</div>
					<h2 className="text-lg font-bold text-gray-900 dark:text-white">Leave History & Requests</h2>
				</div>

				{isLoading ? (
					<div className="p-12 text-center">
						<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
						<p className="mt-4 text-gray-500 font-medium">Loading leave requests...</p>
					</div>
				) : leaves.length === 0 ? (
					<div className="p-12 text-center text-gray-500">
						<Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
						<p className="font-semibold text-lg text-gray-700 dark:text-gray-300">No leave requests yet</p>
						{user?.role === "employee" && (
							<p className="text-sm mt-1 text-indigo-600 hover:underline">
								<Link href="/protected/apply-leave">
									Submit your first request
								</Link>
							</p>
						)}
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="bg-gray-50/80 dark:bg-slate-850 border-b border-gray-100 dark:border-slate-800">
								<tr>
									{(user?.role === "manager" || user?.role === "admin") && (
										<th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Employee
										</th>
									)}
									<th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
										Start Date
									</th>
									<th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
										End Date
									</th>
									<th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
										Type
									</th>
									<th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
										Reason
									</th>
									<th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
										Status
									</th>
									<th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100 dark:divide-slate-800">
								{leaves.map((leave: any) => (
									<tr
										key={leave.id}
										onClick={() => setSelectedLeave(leave)}
										className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition cursor-pointer group"
									>
										{(user?.role === "manager" || user?.role === "admin") && (
											<td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
												{leave.employeeName || "—"}
											</td>
										)}
										<td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
											{formatDate(leave.startDate)}
										</td>
										<td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
											{formatDate(leave.endDate)}
										</td>
										<td className="px-6 py-4">
											<span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/20">
												{leave.type}
											</span>
										</td>
										<td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate italic">
											"{leave.reason}"
										</td>
										<td className="px-6 py-4">
											<div className="flex flex-col gap-0.5">
												<span
													className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold w-fit ${getStatusColor(leave.status)}`}
												>
													{leave.status}
												</span>
												{leave.status === "Rejected" && (leave.rejectionReason || leave.rejection_reason) && (
													<span className="text-[10px] text-red-500 font-medium pl-0.5 max-w-[150px] truncate">
														Click to view note
													</span>
												)}
											</div>
										</td>
										<td className="px-6 py-4 text-sm text-gray-600">
											<button
												onClick={(e) => {
													e.stopPropagation();
													setSelectedLeave(leave);
												}}
												className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition opacity-80 group-hover:opacity-100"
											>
												<Eye className="w-3.5 h-3.5" /> View
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			<LeaveDetailsModal
				isOpen={selectedLeave !== null}
				onClose={() => setSelectedLeave(null)}
				leave={selectedLeave}
			/>
		</div>
	);
}
