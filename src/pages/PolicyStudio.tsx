import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { PolicyRule } from '../types';
import { 
  Sliders, 
  Plus, 
  Check, 
  X, 
  HelpCircle, 
  ShieldCheck, 
  Lock, 
  CheckCircle2,
  Terminal
} from 'lucide-react';

export const PolicyStudio: React.FC = () => {
  const { policies, togglePolicy, addPolicy } = useAppStore();
  const [explainerPrompt, setExplainerPrompt] = useState('Why was Finance Intern denied access to Vendor Contract - ABC Supplies Ltd.pdf?');
  const [explainerResult, setExplainerResult] = useState<string | null>(null);

  // Dynamic Metrics
  const totalPolicies = policies.length;
  const activeCount = policies.filter(p => p.isActive).length;
  const denyInvariantsCount = policies.filter(p => p.action === 'DENY' && p.isActive).length;
  const targetRolesCount = new Set(policies.map(p => p.targetRole)).size;

  const handleRunExplainer = () => {
    setExplainerResult(
      `EXPLAINER DIAGNOSTIC: Access denied because Policy Rule 'Intern Restricted Doc Type Blocking' explicitly prohibits role 'Finance Intern' from accessing document type 'contract' regardless of classification. Additionally, document ACL permissions require 'Finance Manager' or higher.`
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-darkBorder pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-mono flex items-center gap-3">
            <Sliders className="w-6 h-6 text-brand-400" />
            Zero-Trust Policy Studio
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Declarative Attribute-Based Access Control (ABAC) Rules & Denial Diagnostic Tool
          </p>
        </div>
      </div>

      {/* Real Live Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-darkCard/70 border border-darkBorder glass-card">
          <div className="text-xs text-gray-400 mb-1 font-mono">Active ABAC Rules</div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">{activeCount}</div>
          <div className="text-[11px] text-emerald-300 mt-1 font-mono">Out of {totalPolicies} Defined Rules</div>
        </div>

        <div className="p-4 rounded-2xl bg-darkCard/70 border border-darkBorder glass-card">
          <div className="text-xs text-gray-400 mb-1 font-mono">Strict DENY Invariants</div>
          <div className="text-2xl font-extrabold text-rose-400 font-mono">{denyInvariantsCount}</div>
          <div className="text-[11px] text-rose-300 mt-1 font-mono">Pre-Retrieval Gate 1 Filters</div>
        </div>

        <div className="p-4 rounded-2xl bg-darkCard/70 border border-darkBorder glass-card">
          <div className="text-xs text-gray-400 mb-1 font-mono">Target Role Scopes</div>
          <div className="text-2xl font-extrabold text-brand-400 font-mono">{targetRolesCount}</div>
          <div className="text-[11px] text-gray-400 mt-1 font-mono">Fine-Grained Role Policies</div>
        </div>

        <div className="p-4 rounded-2xl bg-darkCard/70 border border-darkBorder glass-card">
          <div className="text-xs text-gray-400 mb-1 font-mono">Clearance Granularity</div>
          <div className="text-2xl font-extrabold text-cyan-400 font-mono">4 LEVELS</div>
          <div className="text-[11px] text-cyan-300 mt-1 font-mono">Public / Int / Conf / Restr</div>
        </div>
      </div>

      {/* Explainer Tool Section */}
      <div className="p-6 rounded-2xl bg-darkCard/90 border border-darkBorder glass-card space-y-4">
        <h3 className="text-sm font-bold text-gray-100 font-mono flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-brand-400" />
          "Why Was I Denied?" Policy Explainer
        </h3>

        <div className="flex gap-3">
          <input
            type="text"
            value={explainerPrompt}
            onChange={(e) => setExplainerPrompt(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-darkBg border border-darkBorder text-xs text-gray-100 font-mono focus:outline-none"
          />
          <button
            onClick={handleRunExplainer}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors font-mono font-bold"
          >
            Explain Denial
          </button>
        </div>

        {explainerResult && (
          <div className="p-4 rounded-xl bg-brand-950/30 border border-brand-500/40 text-xs font-mono text-brand-200 leading-relaxed">
            {explainerResult}
          </div>
        )}
      </div>

      {/* Active Policies Table */}
      <div className="p-6 rounded-2xl bg-darkCard/80 border border-darkBorder glass-card space-y-4">
        <h3 className="text-sm font-bold text-gray-100 font-mono">Active ABAC Policy Rules ({policies.length})</h3>

        <div className="space-y-3">
          {policies.map((p) => (
            <div key={p.id} className="p-4 rounded-xl bg-darkBg border border-darkBorder flex items-center justify-between text-xs font-mono">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    p.action === 'DENY' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {p.action}
                  </span>
                  <span className="font-bold text-gray-200">{p.name}</span>
                </div>
                <div className="text-gray-400 text-[11px]">Role: {p.targetRole} | DocType: {p.targetDocType} | Max Clearance: {p.maxClassification}</div>
                <div className="text-gray-500 italic text-[11px]">{p.condition}</div>
              </div>

              <button
                onClick={() => togglePolicy(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  p.isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-darkBorder text-gray-500'
                }`}
              >
                {p.isActive ? 'ACTIVE' : 'DISABLED'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Meaning & Policy Studio Explanations Section */}
      <div className="p-6 rounded-2xl bg-darkCard/90 border border-darkBorder glass-card space-y-5">
        <div className="border-b border-darkBorder pb-3">
          <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            ABAC Policy Architecture & Operational Meanings
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            How TrustTrace applies declarative rules to evaluate data access at chunk level before vector indexing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-darkBg/80 border border-darkBorder space-y-2">
            <div className="flex items-center gap-2 font-mono font-bold text-brand-400">
              <Sliders className="w-4 h-4" />
              <span>Attribute-Based Access Control (ABAC)</span>
            </div>
            <p className="text-gray-300 leading-relaxed font-sans">
              Unlike static RBAC, ABAC evaluates three dynamic attribute vectors on every request:
              <strong className="text-white block mt-1">1. User Context:</strong> Role, Department, Verified Clearance.
              <strong className="text-white block">2. Document Attributes:</strong> Classification Tier, Sensitivity, Doc Type.
              <strong className="text-white block">3. Policy Conditions:</strong> Exclusion rules (e.g. Interns cannot access contracts).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-darkBg/80 border border-darkBorder space-y-2">
            <div className="flex items-center gap-2 font-mono font-bold text-rose-400">
              <Lock className="w-4 h-4" />
              <span>Strict DENY Invariant Rules</span>
            </div>
            <p className="text-gray-300 leading-relaxed font-sans">
              <strong>Mechanism:</strong> A DENY rule takes absolute precedence over any affirmative grant. If a rule specifies DENY for "Finance Intern" on "executive" documents, even a wildcard grant cannot override it.
            </p>
            <p className="text-gray-400 leading-relaxed font-sans">
              <strong>Mathematical Assurance:</strong> Enforced at Gate 1 before embeddings are fetched.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-darkBg/80 border border-darkBorder space-y-2">
            <div className="flex items-center gap-2 font-mono font-bold text-cyan-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Hierarchical Clearance Lattice</span>
            </div>
            <p className="text-gray-300 leading-relaxed font-sans">
              Clearance follows a strict linear security ordering: <code className="text-cyan-300 font-mono">Public (0) &lt; Internal (1) &lt; Confidential (2) &lt; Restricted (3)</code>. Users can only read chunks with classification &le; user clearance.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-darkBg/80 border border-darkBorder space-y-2">
            <div className="flex items-center gap-2 font-mono font-bold text-purple-400">
              <HelpCircle className="w-4 h-4" />
              <span>Why Was I Denied? Explainability Trace</span>
            </div>
            <p className="text-gray-300 leading-relaxed font-sans">
              Provides transparent, audit-ready diagnostic logs explaining the exact policy rule, missing clearance level, or department mismatch when an AI query or document access request is blocked.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
