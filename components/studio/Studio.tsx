'use client';

import React, { useEffect } from 'react';
import { CommandPalette } from './CommandPalette';
import { DocumentCanvas } from './DocumentCanvas';
import { Icon } from './Icon';
import { Inspector } from './Inspector';
import { OutlinePanel } from './OutlinePanel';
import { SectionLibrary } from './SectionLibrary';
import { StudioProvider, useStudio } from './StudioProvider';
import { StudioTopbar } from './StudioTopbar';
import { TemplateGallery } from './TemplateGallery';
import { Toasts } from './Toasts';

function MobileNav() {
  const { mobilePanel, setMobilePanel, preview } = useStudio();
  if (preview) return null;

  return (
    <nav className="studio-mobile-nav" aria-label="Studio panels">
      <button
        type="button"
        className={`studio-mobile-btn ${mobilePanel === 'outline' ? 'is-active' : ''}`}
        onClick={() => setMobilePanel('outline')}
        aria-pressed={mobilePanel === 'outline'}
      >
        <Icon name="layers" size={16} />
        <span>Outline</span>
      </button>
      <button
        type="button"
        className={`studio-mobile-btn ${mobilePanel === 'canvas' ? 'is-active' : ''}`}
        onClick={() => setMobilePanel('canvas')}
        aria-pressed={mobilePanel === 'canvas'}
      >
        <Icon name="file" size={16} />
        <span>Page</span>
      </button>
      <button
        type="button"
        className={`studio-mobile-btn ${mobilePanel === 'inspector' ? 'is-active' : ''}`}
        onClick={() => setMobilePanel('inspector')}
        aria-pressed={mobilePanel === 'inspector'}
      >
        <Icon name="sliders" size={16} />
        <span>Edit</span>
      </button>
    </nav>
  );
}

function Overlays() {
  const { overlay } = useStudio();
  if (overlay === 'gallery') return <TemplateGallery />;
  if (overlay === 'library') return <SectionLibrary />;
  if (overlay === 'palette') return <CommandPalette />;
  return null;
}

function StudioShell() {
  const { doc, mobilePanel, preview, busy } = useStudio();

  useEffect(() => {
    const previous = document.title;
    document.title = doc.title ? `${doc.title} · CV Studio` : 'Editor · CV Studio';
    return () => {
      document.title = previous;
    };
  }, [doc.title]);

  return (
    <div
      className="studio-shell"
      data-mobile-panel={mobilePanel}
      data-preview={preview ? 'true' : 'false'}
    >
      <StudioTopbar />
      {busy && <div className="studio-busy-bar" aria-hidden="true" />}

      <div className="studio-workspace">
        <aside className="studio-left" aria-label="Document outline">
          <OutlinePanel />
        </aside>
        <section className="studio-center" aria-label="Resume canvas">
          <DocumentCanvas />
        </section>
        <aside className="studio-right" aria-label="Inspector">
          <Inspector />
        </aside>
      </div>

      <MobileNav />
      <Overlays />
      <Toasts />
    </div>
  );
}

export default function Studio() {
  return (
    <StudioProvider>
      <StudioShell />
    </StudioProvider>
  );
}
