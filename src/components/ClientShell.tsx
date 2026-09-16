'use client';

import { ModalProvider } from './ModalContext';
import { ProjectProvider } from './ProjectContext';
import { Navigation } from './Navigation';
import { Header } from './Header';
import { NewItemModal } from './NewItemModal';
import { NewADRModal } from './NewADRModal';
import { LinkDriveModal } from './LinkDriveModal';
import { NewProjectModal } from './NewProjectModal';

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <ProjectProvider>
      <ModalProvider>
        <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
          <Navigation />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>
        </div>

        {/* Global Modals */}
        <NewItemModal />
        <NewADRModal />
        <LinkDriveModal />
        <NewProjectModal />
      </ModalProvider>
    </ProjectProvider>
  );
}
