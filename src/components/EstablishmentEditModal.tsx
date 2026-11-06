import React, { useState, useEffect } from 'react';
import { X, Save, School, Award, CheckCircle2, TrendingUp, Palette } from 'lucide-react';
import { Establishment, RegionConfig, COLLEGE_PALETTE, DEFAULT_REGIONS } from '../types';
import { computeDnb, computeCfg } from '../utils/calculations';

interface EstablishmentEditModalProps {
  establishment: Establishment | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Establishment) => void;
  regions?: RegionConfig[];
}

export const EstablishmentEditModal: React.FC<EstablishmentEditModalProps> = ({
  establishment,
  isOpen,
  onClose,
  onSave,
  regions = DEFAULT_REGIONS,
}) => {
  const [data, setData] = useState<Establishment | null>(null);

  useEffect(() => {
    if (establishment) {
      setData(JSON.parse(JSON.stringify(establishment)));
    }
  }, [establishment]);

  if (!isOpen || !data) return null;

  const dnbComp = computeDnb(data.dnb, data.effectifClasse);
  const cfgComp = computeCfg(data.cfg, data.effectifClasse);

  const handleSave = () => {
    if (data) {
      const errors = [...computeDnb(data.dnb, data.effectifClasse).errors, ...computeCfg(data.cfg, data.effectifClasse).errors];
      if (errors.length > 0) {
        alert(`Impossible d'enregistrer :\n${errors.join('\n')}`);
        return;
      }
      onSave(data);
      onClose();
    }
  };

  const handleEffectifChange = (newEff: number) => {
    setData((prev) => {
      if (!prev) return prev;
      const copy = { ...prev, effectifClasse: newEff };
      if (copy.cfg.inscrits === 0 || copy.cfg.inscrits === prev.effectifClasse) {
        copy.cfg.inscrits = newEff;
      }
      return copy;
    });
  };

  const currentColor = data.color || '#2563eb';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* En-tête */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs border border-white/30"
              style={{ backgroundColor: currentColor }}
            >
              <School className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Édition de l'établissement</h3>
              <p className="text-xs text-blue-100">Fiche détaillée, couleur d'identification & calculs</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/80 hover:text-white rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulaire */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 dark:text-slate-300">
          {/* Informations générales & Couleur */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="font-bold text-slate-800 dark:text-slate-200">Nom de l'établissement :</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-slate-200">Bassin / Secteur :</label>
                <select
                  value={data.bassin || (regions[0]?.name) || 'Douaisis'}
                  onChange={(e) => setData({ ...data, bassin: e.target.value })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                >
                  {regions.map((reg) => (
                    <option key={reg.id} value={reg.name}>
                      {reg.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-amber-900 dark:text-amber-300">Effectif classe :</label>
                <input
                  type="number"
                  min="1"
                  value={data.effectifClasse}
                  onChange={(e) => handleEffectifChange(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl px-3 py-2 text-sm font-black text-amber-900 dark:text-amber-200 focus:outline-hidden focus:border-amber-500 text-center"
                />
              </div>
            </div>

            {/* SÉLECTEUR DE COULEUR PERSONNALISÉE (Demande expresse) */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Couleur d'identification du collège dans les graphiques :
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-mono">{currentColor}</span>
                  <div
                    className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600 shadow-xs"
                    style={{ backgroundColor: currentColor }}
                  />
                </div>
              </div>

              {/* Pastilles de la palette prédéfinie */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {COLLEGE_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setData({ ...data, color: c })}
                    aria-label={`Choisir la couleur ${c}`}
                    className={`w-7 h-7 rounded-xl transition-all transform hover:scale-110 shadow-xs ${
                      currentColor.toLowerCase() === c.toLowerCase()
                        ? 'ring-2 ring-offset-2 ring-blue-600 dark:ring-offset-slate-900 scale-110'
                        : 'border border-slate-300 dark:border-slate-600'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}

                {/* Sélecteur de couleur libre */}
                <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-[11px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                  <span>Personnalisée :</span>
                  <input
                    type="color"
                    value={currentColor}
                    onChange={(e) => setData({ ...data, color: e.target.value })}
                    className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* BLOC DNB PRO */}
          <div className="space-y-3 bg-blue-50/40 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between border-b border-blue-200 dark:border-blue-800 pb-2">
              <h4 className="font-bold text-blue-900 dark:text-blue-200 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                DNB Série Professionnelle
              </h4>
              <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full">
                {dnbComp.tauxPresents}% de réussite ({dnbComp.tauxPresentation}% classe inscrite)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Candidats Inscrits :</label>
                <input
                  type="number"
                  min="0"
                  value={data.dnb.inscrits}
                  onChange={(e) => setData({
                    ...data,
                    dnb: { ...data.dnb, inscrits: Math.max(0, parseInt(e.target.value) || 0) },
                  })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 text-center font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">Candidats Admis :</label>
                <input
                  type="number"
                  min="0"
                  value={data.dnb.admis}
                  onChange={(e) => setData({
                    ...data,
                    dnb: { ...data.dnb, admis: Math.max(0, parseInt(e.target.value) || 0) },
                  })}
                  className="w-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 rounded-lg px-2 py-1.5 text-center font-black"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Candidats Refusés :</label>
                <input
                  type="number"
                  min="0"
                  value={data.dnb.refuses}
                  onChange={(e) => setData({
                    ...data,
                    dnb: { ...data.dnb, refuses: Math.max(0, parseInt(e.target.value) || 0) },
                  })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 text-center font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Mentions DNB */}
            <div className="pt-2 border-t border-blue-200/60 dark:border-blue-800">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] block mb-2">
                Détail des mentions obtenues :
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs">AB</span>
                  <div className="flex-1">
                    <span className="block text-[10px] text-slate-400">Assez Bien</span>
                    <input
                      type="number"
                      min="0"
                      value={data.dnb.mentions?.ab || 0}
                      onChange={(e) => setData({
                        ...data,
                        dnb: {
                          ...data.dnb,
                          mentions: { ...data.dnb.mentions, ab: Math.max(0, parseInt(e.target.value) || 0) },
                        },
                      })}
                      className="w-full font-bold text-slate-900 dark:text-white border-b border-slate-300 dark:border-slate-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 font-bold rounded-lg text-xs">B</span>
                  <div className="flex-1">
                    <span className="block text-[10px] text-slate-400">Bien</span>
                    <input
                      type="number"
                      min="0"
                      value={data.dnb.mentions?.b || 0}
                      onChange={(e) => setData({
                        ...data,
                        dnb: {
                          ...data.dnb,
                          mentions: { ...data.dnb.mentions, b: Math.max(0, parseInt(e.target.value) || 0) },
                        },
                      })}
                      className="w-full font-bold text-slate-900 dark:text-white border-b border-slate-300 dark:border-slate-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="px-2 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg text-xs">TB</span>
                  <div className="flex-1">
                    <span className="block text-[10px] text-slate-400">Très Bien</span>
                    <input
                      type="number"
                      min="0"
                      value={data.dnb.mentions?.tb || 0}
                      onChange={(e) => setData({
                        ...data,
                        dnb: {
                          ...data.dnb,
                          mentions: { ...data.dnb.mentions, tb: Math.max(0, parseInt(e.target.value) || 0) },
                        },
                      })}
                      className="w-full font-bold text-slate-900 dark:text-white border-b border-slate-300 dark:border-slate-600 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BLOC CFG */}
          <div className="space-y-3 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800 pb-2">
              <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Certificat de Formation Générale (CFG)
              </h4>
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                {cfgComp.tauxPresents}% de réussite
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Candidats Inscrits :</label>
                <input
                  type="number"
                  min="0"
                  value={data.cfg.inscrits}
                  onChange={(e) => setData({
                    ...data,
                    cfg: { ...data.cfg, inscrits: Math.max(0, parseInt(e.target.value) || 0) },
                  })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 text-center font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">Candidats Admis :</label>
                <input
                  type="number"
                  min="0"
                  value={data.cfg.admis}
                  onChange={(e) => setData({
                    ...data,
                    cfg: { ...data.cfg, admis: Math.max(0, parseInt(e.target.value) || 0) },
                  })}
                  className="w-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 rounded-lg px-2 py-1.5 text-center font-black"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Candidats Refusés :</label>
                <input
                  type="number"
                  min="0"
                  value={data.cfg.refuses}
                  onChange={(e) => setData({
                    ...data,
                    cfg: { ...data.cfg, refuses: Math.max(0, parseInt(e.target.value) || 0) },
                  })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 text-center font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pied de page modal */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition"
          >
            <Save className="w-4 h-4" />
            Enregistrer les modifications
          </button>
        </div>
      </div>
    </div>
  );
};
