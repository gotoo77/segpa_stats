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
import { SessionData } from '../types';
import { exportSessionToExcel, downloadEmptyTemplate, parseExcelOrCsvFile } from '../utils/excel';
import { initialSessionData } from '../data/mockData';
import { computeDnb, computeCfg } from '../utils/calculations';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionData;
  setSession: React.Dispatch<React.SetStateAction<SessionData>>;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  session,
  setSession,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportStatus('Lecture du fichier en cours...');
      setIsError(false);
      const establishments = await parseExcelOrCsvFile(file);

      if (establishments.length === 0) {
        throw new Error("Aucune ligne d'établissement valide trouvée dans le fichier.");
      }

      setSession((prev) => ({
        ...prev,
        establishments,
        lastUpdated: new Date().toISOString(),
      }));

      setImportStatus(`Succès ! ${establishments.length} établissement(s) importé(s) avec succès.`);
      setTimeout(() => {
        setImportStatus(null);
        onClose();
      }, 1400);
    } catch (err: any) {
      console.error(err);
      setIsError(true);
      setImportStatus(`Erreur lors de l'import : ${err.message || 'Format de fichier non reconnu'}`);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(session, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `StatSEGPA_Sauvegarde_${session.year.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed.year === 'string' && Array.isArray(parsed.establishments) &&
            parsed.establishments.every((est: any) => est && typeof est.id === 'string' && typeof est.name === 'string' &&
              est.dnb && est.cfg && typeof est.effectifClasse === 'number' &&
              typeof est.dnb.inscrits === 'number' && typeof est.dnb.admis === 'number' &&
              typeof est.dnb.refuses === 'number' && est.dnb.mentions &&
              typeof est.cfg.inscrits === 'number' && typeof est.cfg.admis === 'number' &&
              typeof est.cfg.refuses === 'number') &&
            parsed.establishments.every((est: any) =>
              computeDnb(est.dnb, est.effectifClasse).errors.length === 0 &&
              computeCfg(est.cfg, est.effectifClasse).errors.length === 0)) {
          setSession(parsed);
          setImportStatus('Sauvegarde JSON restaurée avec succès !');
          setTimeout(() => {
            setImportStatus(null);
            onClose();
          }, 1200);
        } else {
          throw new Error('Structure JSON invalide.');
        }
      } catch (err: any) {
        setIsError(true);
        setImportStatus("Impossible de lire ce fichier de sauvegarde JSON.");
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = () => {
    if (confirm("Voulez-vous réinitialiser les données avec le jeu d'exemple des collèges ?")) {
      setSession(initialSessionData);
      onClose();
    }
  };

  const handleClearAll = () => {
    if (confirm("Attention : voulez-vous vider tous les établissements pour repartir d'une feuille vierge ?")) {
      setSession((prev) => ({
        ...prev,
        establishments: [
          {
            id: `segpa-${Date.now()}`,
            name: 'Collège 1',
            color: '#2563eb',
            effectifClasse: 14,
            dnb: { inscrits: 0, admis: 0, refuses: 0, mentions: { tb: 0, b: 0, ab: 0 } },
            cfg: { inscrits: 14, admis: 0, refuses: 0 },
          },
        ],
        lastUpdated: new Date().toISOString(),
      }));
      onClose();
    }
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
                <span>Télécharger la sauvegarde complète</span>
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
                <span>Restaurer une sauvegarde JSON</span>
              </button>
            </div>
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
