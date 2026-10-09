import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Settings as SettingsIcon, Moon, Sun, Key, Bell, Shield, Webhook, Check } from 'lucide-react';

export const Settings: React.FC = () => {
  const { theme, toggleTheme } = useAppStore();
  const deliveryMode = import.meta.env.VITE_API_MODE === 'live' ? 'live' : 'mock';
  const [slackWebhook, setSlackWebhook] = useState('https://hooks.slack.com/services/T00/B00/XXXX');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between border-b border-darkBorder pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-mono flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 text-brand-400" />
            Platform & Security Integrations Settings
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Configure SIEM webhooks, API keys, delivery mode, and appearance settings
          </p>
        </div>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Delivery Mode & Theme */}
        <div className="p-6 rounded-2xl bg-darkCard/80 border border-darkBorder glass-card space-y-4">
          <h3 className="text-sm font-bold text-gray-100 font-mono">System Delivery Mode & Theme</h3>

          <div className="flex items-center justify-between text-xs font-mono p-3 rounded-xl bg-darkBg border border-darkBorder">
            <div>
              <span className="font-bold text-gray-200 block">API Integration Mode</span>
              <span className="text-gray-400 text-[11px]">Current Mode: {deliveryMode.toUpperCase()}</span>
            </div>
            <span className="text-gray-400 text-[11px]">Set VITE_API_MODE in .env and restart Vite to change it.</span>
          </div>

          <div className="flex items-center justify-between text-xs font-mono p-3 rounded-xl bg-darkBg border border-darkBorder">
            <div>
              <span className="font-bold text-gray-200 block">Appearance Theme</span>
              <span className="text-gray-400 text-[11px]">Current Theme: {theme.toUpperCase()}</span>
            </div>
            <button
              onClick={toggleTheme}
              className="px-3.5 py-1.5 rounded-xl bg-darkCard hover:bg-darkBorder text-gray-200 font-bold border border-darkBorder flex items-center gap-2"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-brand-400" />}
              Switch Theme
            </button>
          </div>
        </div>

        {/* Webhooks Integration */}
        <div className="p-6 rounded-2xl bg-darkCard/80 border border-darkBorder glass-card space-y-4">
          <h3 className="text-sm font-bold text-gray-100 font-mono flex items-center gap-2">
            <Webhook className="w-4 h-4 text-brand-400" />
            SIEM & Incident Webhook Integrations
          </h3>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <label className="text-gray-400 block mb-1">Slack / Microsoft Teams Alert Webhook URL:</label>
              <input
                type="text"
                value={slackWebhook}
                onChange={(e) => setSlackWebhook(e.target.value)}
                className="w-full p-3 rounded-xl bg-darkBg border border-darkBorder text-gray-200 focus:outline-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2"
              >
                {saved ? <Check className="w-4 h-4" /> : null}
                {saved ? 'Saved Successfully' : 'Save Integrations'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
