import React, { useState } from 'react';
import { X, Send, School, MessageSquare } from 'lucide-react';
import { ColleagueSubmission, COLLEGE_PALETTE } from '../types';

interface TeacherSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (sub: ColleagueSubmission) => void;
  existingEstablishmentNames: string[];
}

export const TeacherSubmissionModal: React.FC<TeacherSubmissionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingEstablishmentNames,
}) => {
  const [colleagueName, setColleagueName] = useState('Mme / M. Enseignant Référent');
  const [establishmentName, setEstablishmentName] = useState(existingEstablishmentNames[0] || 'Collège Exemple');
  const [city, setCity] = useState('');
  const [effectifClasse, setEffectifClasse] = useState(14);
  const [teacherComment, setTeacherComment] = useState('');

  // DNB Pro
  const [dnbInscrits, setDnbInscrits] = useState(12);
  const [dnbAdmis, setDnbAdmis] = useState(10);
  const [dnbRefuses, setDnbRefuses] = useState(2);
  const [dnbAB, setDnbAB] = useState(3);
  const [dnbB, setDnbB] = useState(2);
  const [dnbTB, setDnbTB] = useState(1);

  // CFG
  const [cfgInscrits, setCfgInscrits] = useState(14);
  const [cfgAdmis, setCfgAdmis] = useState(13);
  const [cfgRefuses, setCfgRefuses] = useState(1);

  if (!isOpen) return null;

  const handleEffectifChange = (val: number) => {
    setEffectifClasse(val);
    setCfgInscrits(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submission: ColleagueSubmission = {
      id: `sub-${Date.now()}`,
      establishmentName,
      city,
      submittedBy: colleagueName,
      submittedAt: new Date().toISOString(),
      status: 'pending',
      teacherComment,
      effectifClasse,
      dnb: {
        inscrits: dnbInscrits,
        admis: dnbAdmis,
        refuses: dnbRefuses,
        mentions: { ab: dnbAB, b: dnbB, tb: dnbTB },
      },
      cfg: {
        inscrits: cfgInscrits,
        admis: cfgAdmis,
        refuses: cfgRefuses,
      },
    };

    onSubmit(submission);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* En-tête */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-700 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center" aria-hidden="true">
              <School className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">Espace Déclaration Collègue</h3>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">Transmission Direction</span>
              </div>
              <p className="text-xs text-emerald-100">Transmettez vos résultats de session pour validation par la direction</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="p-1.5 text-white/80 hover:text-white rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps formulaire */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {/* Identité */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="space-y-1">
              <label htmlFor="teacher-name" className="font-bold text-slate-800 dark:text-slate-200">Votre Nom / Rôle :</label>
              <input
                id="teacher-name"
                type="text"
                required
                value={colleagueName}
                onChange={(e) => setColleagueName(e.target.value)}
                placeholder="Ex: M. Dupont (Coordonnateur SEGPA)"
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs font-medium focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="teacher-etab" className="font-bold text-slate-800 dark:text-slate-200">Établissement concerné :</label>
              <input
                id="teacher-etab"
                type="text"
                required
                list="etab-list"
                value={establishmentName}
                onChange={(e) => setEstablishmentName(e.target.value)}
                placeholder="Ex: Collège Jean Moulin"
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs font-semibold focus:border-emerald-500 focus:outline-hidden"
              />
              <datalist id="etab-list">
                {existingEstablishmentNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1 sm:col-span-2 flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
              <div>
                <span className="font-bold text-amber-900 dark:text-amber-200 block">Effectif total de la classe 3e SEGPA :</span>
                <span className="text-[10px] text-amber-800 dark:text-amber-300">Règle : 100% des élèves sont inscrits au CFG</span>
              </div>
              <input
                type="number"
                min="1"
                aria-label="Effectif classe"
                required
                value={effectifClasse}
                onChange={(e) => handleEffectifChange(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-16 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg py-1 text-center font-black text-amber-900 dark:text-amber-200 text-sm focus:border-amber-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* DNB PRO */}
          <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-3">
            <h4 className="font-bold text-blue-900 dark:text-blue-200 text-xs uppercase tracking-wide">
              1. Résultats du Brevet Série Professionnelle (DNB Pro)
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Inscrits :</label>
                <input
                  type="number"
                  min="0"
                  value={dnbInscrits}
                  onChange={(e) => setDnbInscrits(parseInt(e.target.value) || 0)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg py-1.5 text-center font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">Admis :</label>
                <input
                  type="number"
                  min="0"
                  value={dnbAdmis}
                  onChange={(e) => setDnbAdmis(parseInt(e.target.value) || 0)}
                  className="w-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 rounded-lg py-1.5 text-center font-black"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Refusés :</label>
                <input
                  type="number"
                  min="0"
                  value={dnbRefuses}
                  onChange={(e) => setDnbRefuses(parseInt(e.target.value) || 0)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg py-1.5 text-center font-bold"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-blue-200/60 dark:border-blue-800">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Mentions : (AB • B • TB)
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1 rounded">AB</span>
                  <input
                    type="number"
                    min="0"
                    aria-label="Mention Assez Bien"
                    value={dnbAB}
                    onChange={(e) => setDnbAB(parseInt(e.target.value) || 0)}
                    className="w-full text-center font-bold bg-transparent text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-950 px-1 rounded">B</span>
                  <input
                    type="number"
                    min="0"
                    aria-label="Mention Bien"
                    value={dnbB}
                    onChange={(e) => setDnbB(parseInt(e.target.value) || 0)}
                    className="w-full text-center font-bold bg-transparent text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-1 rounded">TB</span>
                  <input
                    type="number"
                    min="0"
                    aria-label="Mention Très Bien"
                    value={dnbTB}
                    onChange={(e) => setDnbTB(parseInt(e.target.value) || 0)}
                    className="w-full text-center font-bold bg-transparent text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CFG */}
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-3">
            <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-xs uppercase tracking-wide">
              2. Résultats du Certificat de Formation Générale (CFG)
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Inscrits (= classe) :</label>
                <input
                  type="number"
                  min="0"
                  value={cfgInscrits}
                  onChange={(e) => setCfgInscrits(parseInt(e.target.value) || 0)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg py-1.5 text-center font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">Admis :</label>
                <input
                  type="number"
                  min="0"
                  value={cfgAdmis}
                  onChange={(e) => setCfgAdmis(parseInt(e.target.value) || 0)}
                  className="w-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 rounded-lg py-1.5 text-center font-black"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Refusés :</label>
                <input
                  type="number"
                  min="0"
                  value={cfgRefuses}
                  onChange={(e) => setCfgRefuses(parseInt(e.target.value) || 0)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg py-1.5 text-center font-bold"
                />
              </div>
            </div>
          </div>

          {/* Commentaire de l'enseignant */}
          <div className="space-y-1">
            <label htmlFor="teacher-comment" className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              Remarque / Contexte pour la direction (facultatif) :
            </label>
            <textarea
              id="teacher-comment"
              rows={2}
              value={teacherComment}
              onChange={(e) => setTeacherComment(e.target.value)}
              placeholder="Ex: 2 élèves n'ont pas passé le DNB sur décision de l'équipe, tous ont validé le CFG..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl p-2.5 text-xs focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              Transmettre à la direction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
