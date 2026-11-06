import React, { useState, useEffect, useMemo } from 'react';
import { SessionData, Establishment, ColleagueSubmission, COLLEGE_PALETTE, DEFAULT_REGIONS } from './types';
import { initialSessionData } from './data/mockData';
import { Header } from './components/Header';
import { TableView } from './components/TableView';
import { DashboardView } from './components/DashboardView';
import { ReviewInboxView } from './components/ReviewInboxView';
import { PresentationMode } from './components/PresentationMode';
import { PrintReport } from './components/PrintReport';
import { ImportExportModal } from './components/ImportExportModal';
import { EstablishmentEditModal } from './components/EstablishmentEditModal';
import { TeacherSubmissionModal } from './components/TeacherSubmissionModal';
import { RegionManageModal } from './components/RegionManageModal';
import { ShieldCheck, Accessibility } from 'lucide-react';

const STORAGE_KEY = 'statsegpa_session_v1';
const THEME_KEY = 'statsegpa_theme';
const BASSIN_KEY = 'statsegpa_bassin_filter';

export const App: React.FC = () => {
  // Thème Sombre / Clair (Dark / Light mode)
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem(THEME_KEY, 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem(THEME_KEY, 'light');
      }
    } catch (e) {
      console.error(e);
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  // Filtre Bassin géographique : Par défaut "Douaisis" comme demandé par son frère !
  const [bassinFilter, setBassinFilter] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(BASSIN_KEY);
      if (saved) return saved;
    } catch {}
    return 'Douaisis';
  });

  useEffect(() => {
    try {
      localStorage.setItem(BASSIN_KEY, bassinFilter);
    } catch {}
  }, [bassinFilter]);

  // Session
  const [session, setSession] = useState<SessionData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.establishments && parsed.establishments.length > 0) {
          parsed.establishments = parsed.establishments.map((e: any, idx: number) => ({
            ...e,
            bassin: e.bassin || (idx >= 11 ? 'Cambrésis' : 'Douaisis'),
            effectifClasse: e.effectifClasse || e.cfg?.inscrits || 14,
            color: e.color || COLLEGE_PALETTE[idx % COLLEGE_PALETTE.length],
          }));
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erreur lors du chargement des données locales:', e);
    }
    return initialSessionData;
  });

  const [currentTab, setCurrentTab] = useState<'dashboard' | 'table' | 'review' | 'presentation' | 'print'>('dashboard');
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isTeacherFormOpen, setIsTeacherFormOpen] = useState(false);
  const [isRegionManagerOpen, setIsRegionManagerOpen] = useState(false);
  const [editingEstablishment, setEditingEstablishment] = useState<Establishment | null>(null);

  // Sauvegarde automatique dans le LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
      console.error('Erreur lors de la sauvegarde locale:', e);
    }
  }, [session]);

  // Session filtrée selon le bassin actif (Douaisis, Cambrésis, ou Toute région personnalisée, ou Tous)
  const activeSession = useMemo<SessionData>(() => {
    if (bassinFilter === 'all') return session;
    const count = session.establishments.filter((e) => e.bassin === bassinFilter).length;
    return {
      ...session,
      bassinName: `Bassin ${bassinFilter} (${count} collège${count > 1 ? 's' : ''})`,
      establishments: session.establishments.filter((e) => e.bassin === bassinFilter),
    };
  }, [session, bassinFilter]);

  const handleResetData = () => {
    if (confirm("Voulez-vous recharger l'exemple officiel des collèges du Douaisis et du Cambrésis ?")) {
      setSession(initialSessionData);
    }
  };

  const handleSaveEstablishment = (updated: Establishment) => {
    setSession((prev) => ({
      ...prev,
      establishments: prev.establishments.map((e) => (e.id === updated.id ? updated : e)),
      lastUpdated: new Date().toISOString(),
    }));
  };

  const handleNewTeacherSubmission = (submission: ColleagueSubmission) => {
    setSession((prev) => ({
      ...prev,
      submissions: [submission, ...(prev.submissions || [])],
      lastUpdated: new Date().toISOString(),
    }));
    setCurrentTab('review');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* En-tête de navigation avec sélecteur de bassin */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        session={session}
        setSession={setSession}
        bassinFilter={bassinFilter}
        setBassinFilter={setBassinFilter}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        onOpenTeacherForm={() => setIsTeacherFormOpen(true)}
        onOpenRegionManager={() => setIsRegionManagerOpen(true)}
        onResetData={handleResetData}
      />

      {/* Contenu principal */}
      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full focus:outline-hidden">
        {currentTab === 'dashboard' && <DashboardView session={activeSession} isDark={isDark} />}
        {currentTab === 'table' && (
          <TableView
            session={activeSession}
            setSession={setSession}
            onEditEstablishment={(est) => setEditingEstablishment(est)}
          />
        )}
        {currentTab === 'review' && (
          <ReviewInboxView
            session={session}
            setSession={setSession}
            onOpenTeacherForm={() => setIsTeacherFormOpen(true)}
          />
        )}
        {currentTab === 'print' && <PrintReport session={activeSession} />}
      </main>

      {/* Mode Présentation Plein Écran */}
      {currentTab === 'presentation' && (
        <PresentationMode
          session={activeSession}
          onClose={() => setCurrentTab('dashboard')}
        />
      )}

      {/* Modal Fiche Établissement (Édition individuelle détaillée + couleur + bassin) */}
      <EstablishmentEditModal
        establishment={editingEstablishment}
        isOpen={!!editingEstablishment}
        onClose={() => setEditingEstablishment(null)}
        onSave={handleSaveEstablishment}
        regions={session.regions || DEFAULT_REGIONS}
      />

      {/* Modal Gestion des Bassins / Régions */}
      <RegionManageModal
        isOpen={isRegionManagerOpen}
        onClose={() => setIsRegionManagerOpen(false)}
        session={session}
        setSession={setSession}
      />

      {/* Modal Espace Déclaration Enseignant */}
      <TeacherSubmissionModal
        isOpen={isTeacherFormOpen}
        onClose={() => setIsTeacherFormOpen(false)}
        onSubmit={handleNewTeacherSubmission}
        existingEstablishmentNames={session.establishments.map((e) => e.name)}
      />

      {/* Modal Import / Export Excel */}
      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        session={session}
        setSession={setSession}
      />

      {/* Pied de page informatif */}
      <footer role="contentinfo" className="no-print mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-200">StatSEGPA</span>
            <span>• Outil de pilotage & analyse statistique DNB Pro & CFG</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] flex-wrap justify-center sm:justify-end">
            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              100% Hors-Ligne & RGPD Conforme
            </span>
            <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-300 font-medium bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
              <Accessibility className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              Conforme W3C • RGAA 4.1.2 • WCAG 2.1 AA
            </span>
            <button
              onClick={() => setCurrentTab('table')}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              Modifier les chiffres
            </button>
            <button
              onClick={() => setCurrentTab('review')}
              className="hover:text-amber-600 dark:hover:text-amber-400 transition font-semibold"
            >
              Revue des collègues
            </button>
            <button
              onClick={() => setCurrentTab('presentation')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition font-semibold"
            >
              Lancer diaporama
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
