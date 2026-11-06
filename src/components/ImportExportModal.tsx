import React, { useRef, useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  FileJson, 
  RotateCcw, 
  Trash2, 
  ShieldCheck, 
  AlertCircle,
  Check
} from 'lucide-react';
import { Establishment, SessionData } from '../types';
import { exportSessionToExcel, downloadEmptyTemplate, parseExcelOrCsvFile } from '../utils/excel';
import { DEFAULT_SESSIONS } from '../data/mockData';
import { createCompleteBackup, parseCompleteBackup, validateSession } from '../utils/backup';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionData;
  setSession: React.Dispatch<React.SetStateAction<SessionData>>;
  sessions: Record<string, SessionData>;
  activeYear: string;
  onRestoreAll: (sessions: Record<string, SessionData>, activeYear: string) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  session,
  setSession,
  sessions,
  activeYear,
  onRestoreAll,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const [excelPreview, setExcelPreview] = useState<{ fileName: string; establishments: Establishment[] } | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setExcelPreview(null);
    setImportStatus('Analyse du fichier Excel en cours…');
    setIsError(false);
    try {
      const establishments = await parseExcelOrCsvFile(file, session.regions?.[0]?.name || 'Douaisis');
      if (!establishments.length) throw new Error('Aucun établissement trouvé');
      setExcelPreview({ fileName: file.name, establishments });
      setImportStatus(null);
    } catch (error) {
      setIsError(true);
      setImportStatus('Import refusé : ' + (error instanceof Error ? error.message : 'Format inconnu'));
    } finally {
      event.target.value = '';
    }
  };

  const handleConfirmExcel = () => {
    if (!excelPreview) return;
    if (!window.confirm('Remplacer les ' + session.establishments.length + ' établissements de ' + session.year +
      ' par les ' + excelPreview.establishments.length + ' établissements importés ? Les autres années resteront intactes.')) return;
    setSession(prev => ({
      ...prev, establishments: excelPreview.establishments, dataOrigin: 'user',
      lastUpdated: new Date().toISOString(),
    }));
    setImportStatus('Import Excel confirmé dans ' + session.year);
    setIsError(false);
    setExcelPreview(null);
  };

  const handleExportJson = () => {
    const backup = createCompleteBackup(sessions, activeYear);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const element = document.createElement('a');
    element.href = href;
    element.download = 'StatSEGPA_Sauvegarde_Toutes_Sessions_' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(element);
    element.click();
    element.remove();
    URL.revokeObjectURL(href);
  };

  const handleImportJson = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (parsed && typeof parsed === 'object' && 'format' in parsed) {
        const backup = parseCompleteBackup(parsed);
        const years = Object.keys(backup.sessions).sort().join(', ');
        if (!window.confirm('Restaurer toutes les sessions (' + years +
          ') ? Cela remplacera intégralement les années présentes dans ce navigateur. Sauvegardez-les avant de continuer.')) return;
        onRestoreAll(backup.sessions, backup.activeYear);
        setImportStatus('Toutes les sessions ont été restaurées.');
      } else if (validateSession(parsed)) {
        if (!window.confirm('Ancienne sauvegarde annuelle détectée. Remplacer seulement ' +
          session.year + ' par ce fichier (' + parsed.year + ') ?')) return;
        setSession({ ...parsed, year: session.year, id: session.id, lastUpdated: new Date().toISOString() });
        setImportStatus('Session annuelle restaurée.');
      } else {
        throw new Error('Sauvegarde inconnue ou structure invalide');
      }
      setIsError(false);
    } catch (error) {
      setIsError(true);
      setImportStatus('Restauration refusée : ' + (error instanceof Error ? error.message : 'Fichier invalide'));
    } finally {
      event.target.value = '';
    }
  };

  const handleResetDemo = () => {
    if (!window.confirm("Réinitialiser uniquement " + session.year + " avec ses données fictives d'exemple ?")) return;
    const example = DEFAULT_SESSIONS[activeYear];
    setSession(example ? structuredClone(example) : {
      ...session, establishments: [], submissions: [], dataOrigin: 'user',
      lastUpdated: new Date().toISOString(),
    });
    setExcelPreview(null);
    onClose();
  };

  const handleClearAll = () => {
    if (!window.confirm('Vider uniquement les établissements de ' + session.year + ' ? Une sauvegarde JSON préalable est recommandée.')) return;
    setSession(prev => ({
      ...prev, establishments: [], submissions: [], dataOrigin: 'user',
      lastUpdated: new Date().toISOString(),
    }));
    setExcelPreview(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* En-tête modal */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center" aria-hidden="true">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Gestion des Données & Fichiers Excel</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Importez, exportez ou sauvegardez en toute autonomie</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message d'état temporaire */}
        {importStatus && (
          <div
            role="status"
            aria-live="polite"
            className={`px-6 py-3 text-xs font-semibold flex items-center gap-2 ${
              isError ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-b border-red-200 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-b border-emerald-200 dark:border-emerald-800'
            }`}
          >
            {isError ? <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" /> : <Check className="w-4 h-4 shrink-0" aria-hidden="true" />}
            <span>{importStatus}</span>
          </div>
        )}

        {/* Corps modal */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600 dark:text-slate-300">
          {/* Section 1 : Excel */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              Échanges Excel / Tableur (.xlsx)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => exportSessionToExcel(session)}
                className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition text-left group"
              >
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 group-hover:scale-105 transition" aria-hidden="true">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <strong className="block text-slate-900 dark:text-white font-semibold text-xs mb-0.5">
                    Exporter les données en Excel
                  </strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Génère un classeur avec les onglets DNB Pro, CFG et Synthèse calculée.
                  </span>
                </div>
              </button>

              <button
                onClick={downloadEmptyTemplate}
                className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition text-left group"
              >
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 group-hover:scale-105 transition" aria-hidden="true">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <strong className="block text-slate-900 dark:text-white font-semibold text-xs mb-0.5">
                    Télécharger un modèle vierge
                  </strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pour transmettre aux collègues ou préparer la saisie hors de l'application.
                  </span>
                </div>
              </button>

              <div className="sm:col-span-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 transition text-slate-700 dark:text-slate-200 font-medium"
                >
                  <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  <span>
                    Glisser-déposer ou cliquer pour <strong>importer un fichier Excel / CSV</strong>
                  </span>
                </button>
              </div>
            </div>
            {excelPreview && (
              <div className="border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/40 rounded-xl p-4 space-y-3" role="region" aria-label="Prévisualisation de l'import Excel">
                <h5 className="font-bold text-sm text-blue-950 dark:text-blue-200">Prévisualisation avant remplacement</h5>
                <p>Fichier : <strong>{excelPreview.fileName}</strong> | Destination : <strong>{session.year}</strong></p>
                <p>{excelPreview.establishments.length} collèges | {excelPreview.establishments.reduce((sum, est) => sum + est.effectifClasse, 0)} élèves</p>
                <p>Bassins : {[...new Set(excelPreview.establishments.map(e => e.bassin || 'Sans bassin'))].join(', ')}</p>
                <p>DNB renseignés : {excelPreview.establishments.filter(e => e.dnbComplete !== false).length}, CFG renseignés : {excelPreview.establishments.filter(e => e.cfgComplete !== false).length}.</p>
                <p className="font-medium">Attention : l'import remplace les établissements de cette année, sans affecter les autres années.</p>
                <div className="flex gap-3">
                  <button onClick={handleConfirmExcel} className="px-4 py-2 rounded-lg text-white bg-blue-700 hover:bg-blue-800 font-bold">Confirmer le remplacement</button>
                  <button onClick={() => setExcelPreview(null)} className="px-4 py-2 rounded-lg border border-slate-400">Annuler</button>
                </div>
              </div>
            )}
          </div>

          {/* Section 2 : Sauvegarde Locale */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
              <FileJson className="w-4 h-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              Sauvegarde de sécurité (JSON)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleExportJson}
                className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-left"
              >
                <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" aria-hidden="true" />
                <span>Sauvegarder toutes les années (JSON)</span>
              </button>

              <input
                type="file"
                ref={jsonInputRef}
                onChange={handleImportJson}
                accept=".json"
                className="hidden"
              />
              <button
                onClick={() => jsonInputRef.current?.click()}
                className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-left"
              >
                <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" aria-hidden="true" />
                <span>Restaurer toutes les années (JSON)</span>
              </button>
            </div>
            <p>La sauvegarde complète conserve les résultats de chaque année, les bassins, les déclarations et l'année sélectionnée. Les anciens fichiers JSON annuels restent importables.</p>
          </div>

          {/* Section 3 : Actions rapides */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              Réinitialisation
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleResetDemo}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Recharger les collèges d'exemple</span>
              </button>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 rounded-xl transition font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Vider la grille (nouvelle session)</span>
              </button>
            </div>
          </div>

          {/* Mention RGPD & Confidentialité */}
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 rounded-2xl flex items-start gap-3 text-emerald-900 dark:text-emerald-200">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <strong className="block text-emerald-950 dark:text-emerald-100 font-bold mb-0.5">
                Fonctionnement local et confidentialité
              </strong>
              <p className="text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-300">
                Les données de travail sont enregistrées dans le stockage local du navigateur, sans synchronisation
                automatique avec un serveur. Protégez les fichiers exportés et sauvegardez-les régulièrement.
                La conformité RGPD dépend également du contexte d'utilisation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
