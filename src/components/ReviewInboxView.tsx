import React, { useState } from 'react';
import { 
  Inbox, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Check, 
  Trash2, 
  PlusCircle, 
  MessageSquare, 
  Sparkles,
  School
} from 'lucide-react';
import { ColleagueSubmission, SessionData, Establishment, COLLEGE_PALETTE } from '../types';
import { computeDnb, computeCfg } from '../utils/calculations';

interface ReviewInboxViewProps {
  session: SessionData;
  setSession: React.Dispatch<React.SetStateAction<SessionData>>;
  onOpenTeacherForm: () => void;
}

export const ReviewInboxView: React.FC<ReviewInboxViewProps> = ({
  session,
  setSession,
  onOpenTeacherForm,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');
  const [selectedSubId, setSelectedSubId] = useState<string | null>(
    session.submissions && session.submissions.length > 0 ? session.submissions[0].id : null
  );

  const [editingSub, setEditingSub] = useState<ColleagueSubmission | null>(null);

  const submissions = session.submissions || [];
  const pendingCount = submissions.filter((s) => s.status === 'pending').length;

  const filteredSubs = submissions.filter((s) => {
    if (filter === 'pending') return s.status === 'pending';
    if (filter === 'approved') return s.status === 'approved' || s.status === 'modified';
    return true;
  });

  const selectedSub = submissions.find((s) => s.id === selectedSubId) || submissions[0] || null;

  const handleStartReview = (sub: ColleagueSubmission) => {
    setSelectedSubId(sub.id);
    setEditingSub(JSON.parse(JSON.stringify(sub)));
  };

  const handleApprove = (submissionToApprove: ColleagueSubmission) => {
    const targetSub = editingSub && editingSub.id === submissionToApprove.id ? editingSub : submissionToApprove;

    const errors = [
      ...computeDnb(targetSub.dnb, targetSub.effectifClasse).errors,
      ...computeCfg(targetSub.cfg, targetSub.effectifClasse).errors,
    ];
    if (errors.length > 0) {
      alert(`Déclaration incohérente :\n${errors.join('\n')}`);
      return;
    }

    const existingIndex = session.establishments.findIndex(
      (e) => e.name.toLowerCase().trim() === targetSub.establishmentName.toLowerCase().trim()
    );

    let updatedEstablishments: Establishment[];
    if (existingIndex >= 0) {
      updatedEstablishments = [...session.establishments];
      updatedEstablishments[existingIndex] = {
        ...updatedEstablishments[existingIndex],
        effectifClasse: targetSub.effectifClasse,
        color: targetSub.color || updatedEstablishments[existingIndex].color,
        dnb: targetSub.dnb,
        cfg: targetSub.cfg,
      };
    } else {
      const color = targetSub.color || COLLEGE_PALETTE[session.establishments.length % COLLEGE_PALETTE.length];
      const newEst: Establishment = {
        id: `segpa-${Date.now()}`,
        name: targetSub.establishmentName,
        city: targetSub.city || '',
        bassin: targetSub.bassin || session.regions?.[0]?.name || 'Douaisis',
        color,
        effectifClasse: targetSub.effectifClasse,
        dnb: targetSub.dnb,
        cfg: targetSub.cfg,
      };
      updatedEstablishments = [...session.establishments, newEst];
    }

    const isModified = JSON.stringify(targetSub.dnb) !== JSON.stringify(submissionToApprove.dnb) ||
                       JSON.stringify(targetSub.cfg) !== JSON.stringify(submissionToApprove.cfg) ||
                       targetSub.effectifClasse !== submissionToApprove.effectifClasse;

    const updatedSubmissions = submissions.map((s) => {
      if (s.id !== targetSub.id) return s;
      return {
        ...targetSub,
        status: isModified ? ('modified' as const) : ('approved' as const),
        directorNotes: isModified ? 'Ajusté et validé par la direction' : 'Validé conforme par la direction',
      };
    });

    setSession((prev) => ({
      ...prev,
      establishments: updatedEstablishments,
      submissions: updatedSubmissions,
      lastUpdated: new Date().toISOString(),
    }));

    setEditingSub(null);
    alert(`Données de "${targetSub.establishmentName}" validées et intégrées au réseau !`);
  };

  const handleDeleteSubmission = (id: string) => {
    if (confirm("Supprimer cette déclaration de la boîte de réception ?")) {
      setSession((prev) => ({
        ...prev,
        submissions: (prev.submissions || []).filter((s) => s.id !== id),
      }));
      setEditingSub(null);
    }
  };

  const handleSimulateColleague = () => {
    const collegues = [
      { name: 'M. Dupont (Collège Louise Michel)', etab: 'Collège Louise Michel', eff: 15, dnbIns: 13, dnbAdm: 11, dnbRef: 2, cfgAdm: 14, color: '#0891b2', comment: 'Résultats très satisfaisants, 2 élèves orientés en CAP direct.' },
      { name: 'Mme Vasseur (Collège Jean Rostand)', etab: 'Collège Jean Rostand', eff: 16, dnbIns: 14, dnbAdm: 13, dnbRef: 1, cfgAdm: 16, color: '#65a30d', comment: '100% de réussite au CFG pour toute la division.' },
    ];
    const pick = collegues[Math.floor(Math.random() * collegues.length)];

    const newSub: ColleagueSubmission = {
      id: `sim-${Date.now()}`,
      establishmentName: pick.etab,
      city: 'Secteur Réseau',
      color: pick.color,
      submittedBy: pick.name,
      submittedAt: new Date().toISOString(),
      status: 'pending',
      teacherComment: pick.comment,
      effectifClasse: pick.eff,
      dnb: {
        inscrits: pick.dnbIns,
        admis: pick.dnbAdm,
        refuses: pick.dnbRef,
        mentions: { ab: 3, b: 2, tb: 1 },
      },
      cfg: {
        inscrits: pick.eff,
        admis: pick.cfgAdm,
        refuses: pick.eff - pick.cfgAdm,
      },
    };

    setSession((prev) => ({
      ...prev,
      submissions: [newSub, ...(prev.submissions || [])],
    }));
    setSelectedSubId(newSub.id);
  };

  const activeSub = editingSub || selectedSub;

  return (
    <div className="space-y-6 pb-16 transition-colors">
      {/* Barre supérieure */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Boîte de Revue & Validation des Collègues
            </h2>
            {pendingCount > 0 ? (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-700 animate-pulse">
                {pendingCount} en attente
              </span>
            ) : (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-700">
                Toutes les fiches sont validées
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Espace de contrôle de direction : vérifiez les déclarations, corrigez les erreurs de saisie et validez leur intégration dans le bassin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateColleague}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition"
            title="Générer une soumission pour tester la boîte de réception"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
            <span>Simuler une déclaration</span>
          </button>
          <button
            onClick={onOpenTeacherForm}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" aria-hidden="true" />
            <span>Nouvelle déclaration</span>
          </button>
        </div>
      </div>

      {/* Grille principale */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne Gauche */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilter('pending')}
              className={`flex-1 py-1.5 rounded-lg transition ${
                filter === 'pending' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              En attente ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`flex-1 py-1.5 rounded-lg transition ${
                filter === 'approved' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Validées ({submissions.length - pendingCount})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-1.5 rounded-lg transition ${
                filter === 'all' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Toutes ({submissions.length})
            </button>
          </div>

          {filteredSubs.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
              <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" aria-hidden="true" />
              Aucune déclaration dans cette catégorie.
            </div>
          ) : (
            filteredSubs.map((sub) => {
              const isSelected = (editingSub?.id || selectedSubId) === sub.id;
              const dnbComp = computeDnb(sub.dnb, sub.effectifClasse);
              const hasWarnings = dnbComp.errors.length > 0;

              return (
                <div
                  key={sub.id}
                  onClick={() => handleStartReview(sub)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{sub.establishmentName}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{sub.submittedBy}</p>
                    </div>
                    {sub.status === 'pending' ? (
                      <span className="flex items-center gap-1 text-[10px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        À vérifier
                      </span>
                    ) : sub.status === 'modified' ? (
                      <span className="flex items-center gap-1 text-[10px] bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3" />
                        Validé (modifié)
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3" />
                        Validé
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-2">
                    <span>
                      Effectif: <strong>{sub.effectifClasse}</strong> • DNB: {sub.dnb.admis}/{sub.dnb.inscrits}
                    </span>
                    <span className="font-semibold text-blue-700 dark:text-blue-400">
                      CFG: {sub.cfg.admis}/{sub.cfg.inscrits}
                    </span>
                  </div>

                  {hasWarnings && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-1 rounded-lg">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">Anomalie détectée dans les chiffres</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Colonne Droite */}
        <div className="lg:col-span-7">
          {activeSub ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-semibold">
                      Examen de direction
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{activeSub.establishmentName}</h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Transmis par <strong>{activeSub.submittedBy}</strong> le {new Date(activeSub.submittedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                <button
                  onClick={() => handleDeleteSubmission(activeSub.id)}
                  aria-label="Supprimer cette soumission"
                  className="p-2 text-slate-400 hover:text-red-600 rounded-xl transition self-start sm:self-center"
                  title="Supprimer cette soumission"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {activeSub.teacherComment && (
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
                  <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-white block">Note du collègue :</span>
                    <p className="italic mt-0.5 text-slate-600 dark:text-slate-300">"{activeSub.teacherComment}"</p>
                  </div>
                </div>
              )}

              {/* Panneau de modification */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Chiffres déclarés (modifiables en direct avant validation) :
                  </h4>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                    ✏️ Vous pouvez ajuster n'importe quel chiffre si besoin
                  </span>
                </div>

                {/* Effectif Classe */}
                <div className="bg-amber-50/60 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-amber-900 dark:text-amber-200 text-xs block">Effectif total de la classe 3e :</span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400">Base d'élèves pour les calculs de taux</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    aria-label="Effectif classe"
                    value={activeSub.effectifClasse}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value) || 0);
                      setEditingSub({ ...activeSub, effectifClasse: val });
                    }}
                    className="w-16 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-slate-900 dark:text-white rounded-lg py-1 text-center font-bold text-sm"
                  />
                </div>

                {/* Grille DNB Pro */}
                <div className="bg-blue-50/40 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 dark:text-blue-200 text-xs">DNB PRO</span>
                    <span className="text-xs text-blue-800 dark:text-blue-300 font-semibold">
                      Taux calculé : {computeDnb(activeSub.dnb, activeSub.effectifClasse).tauxPresents}% sur candidats
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Inscrits :</span>
                      <input
                        type="number"
                        value={activeSub.dnb.inscrits}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setEditingSub({ ...activeSub, dnb: { ...activeSub.dnb, inscrits: val } });
                        }}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg py-1 text-center font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block">Admis :</span>
                      <input
                        type="number"
                        value={activeSub.dnb.admis}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setEditingSub({ ...activeSub, dnb: { ...activeSub.dnb, admis: val } });
                        }}
                        className="w-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-lg py-1 text-center font-black text-emerald-900 dark:text-emerald-200"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Refusés :</span>
                      <input
                        type="number"
                        value={activeSub.dnb.refuses}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setEditingSub({ ...activeSub, dnb: { ...activeSub.dnb, refuses: val } });
                        }}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg py-1 text-center font-bold"
                      />
                    </div>
                  </div>

                  {/* Mentions */}
                  <div className="pt-2 border-t border-blue-200/60 dark:border-blue-800 flex items-center justify-between gap-3 text-xs">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Mentions :</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">AB:</span>
                        <input
                          type="number"
                          value={activeSub.dnb.mentions?.ab || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setEditingSub({ ...activeSub, dnb: { ...activeSub.dnb, mentions: { ...activeSub.dnb.mentions, ab: val } } });
                          }}
                          className="w-8 text-center font-bold bg-transparent text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400">B:</span>
                        <input
                          type="number"
                          value={activeSub.dnb.mentions?.b || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setEditingSub({ ...activeSub, dnb: { ...activeSub.dnb, mentions: { ...activeSub.dnb.mentions, b: val } } });
                          }}
                          className="w-8 text-center font-bold bg-transparent text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">TB:</span>
                        <input
                          type="number"
                          value={activeSub.dnb.mentions?.tb || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setEditingSub({ ...activeSub, dnb: { ...activeSub.dnb, mentions: { ...activeSub.dnb.mentions, tb: val } } });
                          }}
                          className="w-8 text-center font-bold bg-transparent text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grille CFG */}
                <div className="bg-emerald-50/40 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 dark:text-emerald-200 text-xs">CFG</span>
                    <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                      Taux calculé : {computeCfg(activeSub.cfg, activeSub.effectifClasse).tauxPresents}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Inscrits (= classe) :</span>
                      <input
                        type="number"
                        value={activeSub.cfg.inscrits}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setEditingSub({ ...activeSub, cfg: { ...activeSub.cfg, inscrits: val } });
                        }}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg py-1 text-center font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block">Admis :</span>
                      <input
                        type="number"
                        value={activeSub.cfg.admis}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setEditingSub({ ...activeSub, cfg: { ...activeSub.cfg, admis: val } });
                        }}
                        className="w-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-lg py-1 text-center font-black text-emerald-900 dark:text-emerald-200"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Refusés :</span>
                      <input
                        type="number"
                        value={activeSub.cfg.refuses}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setEditingSub({ ...activeSub, cfg: { ...activeSub.cfg, refuses: val } });
                        }}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg py-1 text-center font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bouton de validation */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {activeSub.status === 'pending'
                    ? 'Cette déclaration sera fusionnée dans la liste officielle du réseau.'
                    : 'Déclaration déjà validée. Cliquez pour ré-appliquer les modifications.'}
                </span>

                <button
                  onClick={() => handleApprove(activeSub)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-600/20 transition transform hover:scale-[1.02]"
                >
                  <CheckCircle className="w-5 h-5" aria-hidden="true" />
                  <span>Valider et intégrer au réseau</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-slate-400">
              <School className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" aria-hidden="true" />
              Sélectionnez une déclaration à gauche pour l'examiner et la valider.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
