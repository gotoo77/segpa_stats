import React from 'react';
import { 
  BarChart3, 
  Table2, 
  Presentation, 
  Printer, 
  Download, 
  Upload, 
  RotateCcw, 
  ShieldCheck, 
  Calendar,
  School,
  Inbox,
  UserCheck,
  Sun,
  Moon,
  Accessibility,
  MapPin,
  Settings2
} from 'lucide-react';
import { SessionData, RegionConfig, DEFAULT_REGIONS } from '../types';

interface HeaderProps {
  currentTab: 'dashboard' | 'table' | 'review' | 'presentation' | 'print';
  setCurrentTab: (tab: 'dashboard' | 'table' | 'review' | 'presentation' | 'print') => void;
  session: SessionData;
  setSession: React.Dispatch<React.SetStateAction<SessionData>>;
  bassinFilter: string;
  setBassinFilter: (bassin: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenImportExport: () => void;
  onOpenTeacherForm: () => void;
  onOpenRegionManager: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  session,
  setSession,
  bassinFilter,
  setBassinFilter,
  isDark,
  onToggleTheme,
  onOpenImportExport,
  onOpenTeacherForm,
  onOpenRegionManager,
  onResetData,
}) => {
  const pendingSubmissions = (session.submissions || []).filter((s) => s.status === 'pending').length;

  const regions: RegionConfig[] = session.regions && session.regions.length > 0 
    ? session.regions 
    : DEFAULT_REGIONS;

  const getBassinCount = (name: string) => {
    return session.establishments.filter((e) => e.bassin === name).length;
  };

  return (
    <header role="banner" className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs no-print transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          {/* Logo & Titre */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0" aria-hidden="true">
              <School className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">StatSEGPA</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-800">
                  {bassinFilter === 'all' ? 'Tous les secteurs' : `Secteur ${bassinFilter}`}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800" title="100% hors-ligne, aucune donnée transmise sur le cloud">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  100% RGPD
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700" title="Conforme W3C, RGAA 4.1.2 et WCAG 2.1 AA">
                  <Accessibility className="w-3 h-3 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  Accessibilité
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                <input
                  type="text"
                  aria-label="Nom du bassin d'éducation"
                  value={session.bassinName}
                  onChange={(e) => setSession({ ...session, bassinName: e.target.value })}
                  className="font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 px-1 py-0.5 rounded transition border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-400 focus:outline-hidden"
                  title="Cliquer pour modifier le titre"
                />
                <span aria-hidden="true">•</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  <input
                    type="text"
                    aria-label="Session d'examen"
                    value={session.year}
                    onChange={(e) => setSession({ ...session, year: e.target.value })}
                    className="font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 px-1 py-0.5 rounded transition border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-400 focus:outline-hidden w-28"
                    title="Cliquer pour changer la session"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Onglets */}
          <nav aria-label="Navigation principale" className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl self-start md:self-center text-xs font-medium">
            <button
              onClick={() => setCurrentTab('dashboard')}
              aria-current={currentTab === 'dashboard' ? 'page' : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" aria-hidden="true" />
              Graphiques
            </button>
            <button
              onClick={() => setCurrentTab('table')}
              aria-current={currentTab === 'table' ? 'page' : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                currentTab === 'table'
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Table2 className="w-4 h-4" aria-hidden="true" />
              Saisie Tableur
            </button>
            <button
              onClick={() => setCurrentTab('review')}
              aria-current={currentTab === 'review' ? 'page' : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all relative ${
                currentTab === 'review'
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Inbox className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              Revue & Validation
              {pendingSubmissions > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-bold text-[10px] animate-pulse">
                  {pendingSubmissions}
                </span>
              )}
            </button>
            <button
              onClick={() => setCurrentTab('presentation')}
              aria-current={currentTab === 'presentation' ? 'page' : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                currentTab === 'presentation'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Presentation className="w-4 h-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              Présentation
            </button>
            <button
              onClick={() => setCurrentTab('print')}
              aria-current={currentTab === 'print' ? 'page' : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                currentTab === 'print'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Printer className="w-4 h-4" aria-hidden="true" />
              Rapport
            </button>
          </nav>

          {/* Boutons d'actions rapides */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleTheme}
              aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
              title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition border border-slate-200 dark:border-slate-700"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <button
              onClick={onOpenTeacherForm}
              aria-label="Ouvrir l'espace collègue enseignant"
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 rounded-lg transition border border-emerald-200 dark:border-emerald-800"
              title="Ouvrir le formulaire enseignant pour transmettre des chiffres"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span className="hidden sm:inline">Espace Collègue</span>
            </button>
            <button
              onClick={onOpenImportExport}
              aria-label="Ouvrir les options d'import et export Excel"
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition border border-slate-200 dark:border-slate-700"
              title="Importer ou exporter vers Excel / CSV"
            >
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Excel</span>
            </button>
            <button
              onClick={onResetData}
              aria-label="Réinitialiser les données de démonstration"
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              title="Réinitialiser avec l'exemple des collèges"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* SÉLECTEUR DYNAMIQUE DE BASSINS & GESTION DES RÉGIONS */}
        <div className="py-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Secteur :</span>

            <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg flex-wrap gap-0.5">
              {regions.map((reg) => {
                const count = getBassinCount(reg.name);
                const isActive = bassinFilter === reg.name;

                return (
                  <button
                    key={reg.id}
                    onClick={() => setBassinFilter(reg.name)}
                    className={`px-3 py-1 rounded-md font-semibold transition flex items-center gap-1.5 ${
                      isActive
                        ? 'text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    style={isActive ? { backgroundColor: reg.color } : {}}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: reg.color }}
                    />
                    <span>{reg.name} ({count})</span>
                  </button>
                );
              })}

              <button
                onClick={() => setBassinFilter('all')}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  bassinFilter === 'all'
                    ? 'bg-slate-800 text-white dark:bg-slate-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Tous ({session.establishments.length})
              </button>
            </div>
          </div>

          <button
            onClick={onOpenRegionManager}
            className="flex items-center gap-1 px-2.5 py-1 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium"
            title="Créer, modifier ou configurer les bassins et leurs couleurs"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Gérer les bassins / régions</span>
          </button>
        </div>
      </div>
    </header>
  );
};
