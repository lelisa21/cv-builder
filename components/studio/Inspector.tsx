'use client';

import React from 'react';
import type { StudioTab } from '@/lib/studio/types';
import { ContentInspector } from './ContentInspector';
import { DesignInspector } from './DesignInspector';
import { Icon, type IconName } from './Icon';
import { InsightsPanel } from './InsightsPanel';
import { useStudio } from './StudioProvider';

const TABS: Array<{ id: StudioTab; label: string; icon: IconName }> = [
  { id: 'content', label: 'Content', icon: 'text' },
  { id: 'design', label: 'Design', icon: 'palette' },
  { id: 'insights', label: 'Insights', icon: 'target' },
];

export function Inspector() {
  const { tab, setTab } = useStudio();

  return (
    <>
      <div className="inspector-tabs" role="tablist" aria-label="Inspector">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={tab === entry.id}
            className={`inspector-tab ${tab === entry.id ? 'is-active' : ''}`}
            onClick={() => setTab(entry.id)}
          >
            <Icon name={entry.icon} size={13} />
            {entry.label}
          </button>
        ))}
      </div>

      <div className="inspector-body" role="tabpanel">
        {tab === 'content' && <ContentInspector />}
        {tab === 'design' && <DesignInspector />}
        {tab === 'insights' && <InsightsPanel />}
      </div>
    </>
  );
}
