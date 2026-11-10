'use client';

import React from 'react';
import { Icon } from './Icon';
import { useStudio } from './StudioProvider';

export function Toasts() {
  const { toasts } = useStudio();
  if (toasts.length === 0) return null;

  return (
    <div className="studio-toasts" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div className="studio-toast" key={toast.id} data-tone={toast.tone}>
          <Icon
            name={
              toast.tone === 'error'
                ? 'alert'
                : toast.tone === 'info'
                  ? 'info'
                  : 'checkCircle'
            }
            size={14}
          />
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
