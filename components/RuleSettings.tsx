import React from 'react';
import { RuleConfig } from '../types';
import { Settings } from 'lucide-react';

interface RuleSettingsProps {
  rules: RuleConfig;
  onToggleSubrule: (
    category: string,
    subrule: string,
    active: boolean
  ) => void;
  onToggleSelectAll: (category: string) => void;
  disabled?: boolean;
}

export const RuleSettings: React.FC<RuleSettingsProps> = ({
  rules,
  onToggleSubrule,
  onToggleSelectAll,
  disabled
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center space-x-2">
        <Settings size={18} className="text-indigo-600" />
        <h3 className="font-semibold text-slate-800">
          Phonological Correction Rules
        </h3>
      </div>

      <div className="p-6 space-y-6">
        {Object.entries(rules).map(([categoryKey, category]) => (
          <div key={categoryKey}>
            {/* Category Header */}
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-slate-800">
                {category.label}
              </span>

              <button
                type="button"
                disabled={disabled}
                onClick={() => onToggleSelectAll(categoryKey)}
                className={`text-xs ${
                  disabled
                    ? 'text-slate-400'
                    : 'text-indigo-600 hover:text-indigo-700'
                }`}
              >
                {category.selectAll ? 'Unselect All' : 'Select All'}
              </button>
            </div>

            {/* Subrules */}
            <div className="ml-4 space-y-3">
              {Object.entries(category.subrules).map(
                ([subKey, subrule]) => (
                  <label
                    key={subKey}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      disabled={disabled}
                      checked={subrule.active}
                      onChange={(e) =>
                        onToggleSubrule(
                          categoryKey,
                          subKey,
                          e.target.checked
                        )
                      }
                      className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 rounded"
                    />
                    <span
                      className={`text-sm ${
                        disabled ? 'text-slate-400' : 'text-slate-700'
                      }`}
                    >
                      {subrule.label}
                    </span>
                  </label>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
