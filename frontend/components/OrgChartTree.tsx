'use client';

import { useState, useRef } from 'react';
import { ChevronDown, ChevronRight, User } from 'lucide-react';
import { OrgNode } from '@/lib/types';

interface OrgChartTreeProps {
  nodes: OrgNode[];
  depth?: number;
  nodeRefs?: React.MutableRefObject<Record<number, HTMLDivElement | null>>;
  allNodes?: OrgNode[];
}

function getRoleBadgeClasses(role: string): string {
  switch (role) {
    case 'admin':
      return 'bg-indigo-100 text-indigo-700';
    case 'manager':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-emerald-100 text-emerald-700';
  }
}

interface OrgNodeCardProps {
  node: OrgNode;
  collapsed: boolean;
  onToggle: () => void;
  hasChildren: boolean;
  nodeRef: (el: HTMLDivElement | null) => void;
}

function OrgNodeCard({ node, collapsed, onToggle, hasChildren, nodeRef }: OrgNodeCardProps) {
  return (
    <div
      ref={nodeRef}
      className="inline-flex flex-col items-center relative z-10"
    >
      <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_20px_-6px_rgba(6,81,237,0.2)] hover:-translate-y-0.5 transition-all duration-300 min-w-[180px] max-w-[240px]">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-xl ${getRoleBadgeClasses(node.role).split(' ')[0]} bg-opacity-50`}>
            <User className={`w-4 h-4 ${getRoleBadgeClasses(node.role).split(' ')[1]}`} />
          </div>
          <div className="flex flex-col items-start overflow-hidden">
            <span className="text-sm font-bold text-gray-900 truncate w-full text-left">{node.name}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${getRoleBadgeClasses(node.role).split(' ')[1]}`}>
              {node.role}
            </span>
          </div>
        </div>
        {node.department && (
          <p className="text-xs text-gray-500 mt-2 truncate font-medium text-left bg-gray-50 px-2 py-1 rounded-md">{node.department}</p>
        )}
        {hasChildren && (
          <button
            onClick={onToggle}
            className="mt-3 flex items-center justify-center w-full gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 py-1.5 rounded-lg transition-colors"
            aria-label={collapsed ? 'Expand subtree' : 'Collapse subtree'}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {collapsed ? 'Show Team' : 'Hide Team'} ({node.children.length})
          </button>
        )}
      </div>
    </div>
  );
}

const treeStyles = `
.org-tree ul {
  padding-top: 24px;
  position: relative;
  display: flex;
  justify-content: center;
  transition: all 0.3s ease;
}
.org-tree li {
  float: left;
  text-align: center;
  list-style-type: none;
  position: relative;
  padding: 24px 12px 0 12px;
  transition: all 0.3s ease;
}
.org-tree li::before, .org-tree li::after {
  content: '';
  position: absolute;
  top: 0;
  right: 50%;
  border-top: 2px solid #cbd5e1; /* slate-300 */
  width: 50%;
  height: 24px;
  z-index: 0;
}
.org-tree li::after {
  right: auto;
  left: 50%;
  border-left: 2px solid #cbd5e1;
}
.org-tree li:only-child::after, .org-tree li:only-child::before {
  display: none;
}
.org-tree li:only-child {
  padding-top: 0;
}
.org-tree li:first-child::before, .org-tree li:last-child::after {
  border: 0 none;
}
.org-tree li:last-child::before {
  border-right: 2px solid #cbd5e1;
  border-radius: 0 8px 0 0;
}
.org-tree li:first-child::after {
  border-radius: 8px 0 0 0;
}
.org-tree ul ul::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  border-left: 2px solid #cbd5e1;
  width: 0;
  height: 24px;
  transform: translateX(-50%);
  z-index: 0;
}
`;

export default function OrgChartTree({ nodes, depth = 0, nodeRefs: externalRefs, allNodes }: OrgChartTreeProps) {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const internalRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const nodeRefs = externalRefs ?? internalRefs;

  const toggle = (id: number) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (nodes.length === 0) {
    return depth === 0 ? (
      <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
        <User className="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50" />
        <p className="font-semibold text-gray-600">No organizational data available</p>
        <p className="text-sm mt-1 text-gray-400">Team members will appear here</p>
      </div>
    ) : null;
  }

  const TreeContent = (
    <ul>
      {nodes.map((node) => {
        const isCollapsed = collapsed.has(node.id);
        return (
          <li key={node.id}>
            <div className="flex flex-col items-center">
              <OrgNodeCard
                node={node}
                collapsed={isCollapsed}
                onToggle={() => toggle(node.id)}
                hasChildren={node.children.length > 0}
                nodeRef={(el) => { nodeRefs.current[node.id] = el; }}
              />
              {node.reporting_manager_id !== null && (
                <div className="mt-2 flex items-center justify-center relative z-10">
                  <span className="text-[10px] font-bold text-amber-700 border border-dashed border-amber-300 rounded-md px-2 py-0.5 bg-amber-50 shadow-sm uppercase tracking-wide">
                    Reports to ID: {node.reporting_manager_id}
                  </span>
                </div>
              )}
            </div>
            {!isCollapsed && node.children.length > 0 && (
              <OrgChartTree
                nodes={node.children}
                depth={depth + 1}
                nodeRefs={nodeRefs}
                allNodes={allNodes}
              />
            )}
          </li>
        );
      })}
    </ul>
  );

  if (depth === 0) {
    return (
      <div className="org-tree overflow-auto py-12 px-4 flex justify-center bg-slate-50/50 rounded-3xl border border-slate-100 min-h-[500px]">
        <style dangerouslySetInnerHTML={{ __html: treeStyles }} />
        {TreeContent}
      </div>
    );
  }

  return TreeContent;
}
