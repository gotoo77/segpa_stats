import React, { useState } from 'react';
import { X, Plus, Trash2, MapPin, Palette, Check, School } from 'lucide-react';
import { SessionData, RegionConfig, COLLEGE_PALETTE, DEFAULT_REGIONS } from '../types';

interface RegionManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionData;
  setSession: React.Dispatch<React.SetStateAction<SessionData>>;
}

export const RegionManageModal: React.FC<RegionManageModalProps> = ({
  isOpen,
  onClose,
  session,
  setSession,
}) => {
  const regions: RegionConfig[] = session.regions && session.regions.length > 0 
    ? session.regions 
    : DEFAULT_REGIONS;

  const [newRegionName, setNewRegionName] = useState('');
  const [newRegionColor, setNewRegionColor] = useState('#2563eb');

  if (!isOpen) return null;

  const handleAddRegion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRegionName.trim()) return;

    const newReg: RegionConfig = {
      id: `reg-${Date.now()}`,
      name: newRegionName.trim(),
      color: newRegionColor,
    };

    setSession((prev) => ({
      ...prev,
      regions: [...(prev.regions || DEFAULT_REGIONS), newReg],
      lastUpdated: new Date().toISOString(),
    }));

    setNewRegionName('');
    setNewRegionColor(COLLEGE_PALETTE[(regions.length + 1) % COLLEGE_PALETTE.length]);
  };

  const handleUpdateRegion = (id: string, name: string, color: string) => {
    setSession((prev) => {
      const oldRegion = regions.find((r) => r.id === id);
      const updatedRegions = (prev.regions || DEFAULT_REGIONS).map((r) =>
        r.id === id ? { ...r, name, color } : r
      );

      // Si le nom a changé, mettre à jour le bassin des établissements correspondants
      let updatedEstablishments = prev.establishments;
      if (oldRegion && oldRegion.name !== name) {
        updatedEstablishments = prev.establishments.map((est) =>
          est.bassin === oldRegion.name ? { ...est, bassin: name } : est
        );
      }

      return {
        ...prev,
        regions: updatedRegions,
        establishments: updatedEstablishments,
        lastUpdated: new Date().toISOString(),
      };
    });
  };

  const handleDeleteRegion = (id: string, name: string) => {
    if (regions.length <= 1) {
      alert("Il faut au minimum un bassin ou une région configurée.");
      return;
    }

    if (confirm(`Supprimer le bassin "${name}" ? Les établissements associés seront réaffectés au premier bassin.`)) {
      const remaining = regions.filter((r) => r.id !== id);
      const fallbackName = remaining[0]?.name || 'Douaisis';

      setSession((prev) => ({
        ...prev,
        regions: remaining,
        establishments: prev.establishments.map((est) =>
          est.bassin === name ? { ...est, bassin: fallbackName } : est
        ),
        lastUpdated: new Date().toISOString(),
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* En-tête */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center" aria-hidden="true">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Gestion des Bassins & Régions</h3>
              <p className="text-xs text-blue-100">Définissez de nouveaux secteurs et personnalisez leurs couleurs</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="p-1.5 text-white/80 hover:text-white rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 dark:text-slate-300">
          {/* Formulaire d'ajout d'une nouvelle région */}
          <form onSubmit={handleAddRegion} className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Créer un nouveau bassin / secteur
            </h4>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                placeholder="Ex: Bassin Valenciennois, Flandres..."
                value={newRegionName}
                onChange={(e) => setNewRegionName(e.target.value)}
                className="flex-1 w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs font-semibold focus:border-blue-500 focus:outline-hidden"
              />

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-[11px] cursor-pointer">
                  <Palette className="w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="color"
                    value={newRegionColor}
                    onChange={(e) => setNewRegionColor(e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                  />
                </label>

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition shrink-0"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </form>

          {/* Liste des régions existantes */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              Bassins et régions actuels ({regions.length})
            </h4>

            <div className="space-y-2">
              {regions.map((reg) => {
                const count = session.establishments.filter((e) => e.bassin === reg.name).length;

                return (
                  <div
                    key={reg.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 gap-3"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-4 h-4 rounded-full shadow-xs border border-white/20 shrink-0"
                        style={{ backgroundColor: reg.color }}
                      />
                      <input
                        type="text"
                        value={reg.name}
                        onChange={(e) => handleUpdateRegion(reg.id, e.target.value, reg.color)}
                        className="font-bold text-sm text-slate-900 dark:text-white bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-white dark:focus:bg-slate-800 px-2 py-1 rounded border border-transparent focus:border-blue-400 focus:outline-hidden"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-1">
                        <School className="w-3.5 h-3.5 text-slate-400" />
                        {count} collège{count > 1 ? 's' : ''}
                      </span>

                      <label className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer" title="Changer la couleur">
                        <input
                          type="color"
                          value={reg.color}
                          onChange={(e) => handleUpdateRegion(reg.id, reg.name, e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                        />
                      </label>

                      <button
                        onClick={() => handleDeleteRegion(reg.id, reg.name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
                        title="Supprimer ce bassin"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            Terminé
          </button>
        </div>
      </div>
    </div>
  );
};
