// src/components/ScoreDialog.tsx

import React, 'useState', 'useEffect' from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { XCircleIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Team { id: number; name: string; }
interface Match { id: number; teams: [Team, Team] | null; score1: number | null; score2: number | null; }

interface ScoreDialogProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
}

const ScoreDialog: React.FC<ScoreDialogProps> = ({ match, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [score1, setScore1] = useState('');
  const [score2, setScore2] = useState('');
  
  useEffect(() => {
    if (isOpen && match) {
      setScore1(match.score1?.toString() ?? '');
      setScore2(match.score2?.toString() ?? '');
    }
  }, [isOpen, match]);

  const updateScoresMutation = useMutation({
    mutationFn: async (scores: { s1: number | null, s2: number | null }) => {
      if (!match) throw new Error("Match tidak ditemukan");
      const { error } = await supabase.from('matches').update({ score1: scores.s1, score2: scores.s2 }).eq('id', match.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Skor berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      onClose();
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalScore1 = score1 === '' ? null : Number(score1);
    const finalScore2 = score2 === '' ? null : Number(score2);
    if (isNaN(finalScore1 as number) || isNaN(finalScore2 as number)) {
      toast.error("Input skor tidak valid.");
      return;
    }
    updateScoresMutation.mutate({ s1: finalScore1, s2: finalScore2 });
  };

  if (!match) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* 
        ======================================================
        ====== INI DIA PERBAIKAN FINALNYA 👇 ======
        ======================================================
      */}
      <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-0">
        {/*
          Kita hapus semua style lama dan ganti dengan yang ini.
          - `fixed`: Membuat posisinya absolut terhadap viewport.
          - `left-1/2 top-1/2`: Posisikan titik kiri atasnya di tengah layar.
          - `-translate-x-1/2 -translate-y-1/2`: Tarik kembali setengah dari lebarnya ke kiri dan setengah tingginya ke atas. Ini adalah trik CSS standar untuk benar-benar memusatkan elemen.
          - `w-full max-w-md`: Lebarnya 100%, tapi tidak lebih dari `max-w-md` (medium). Ini membuatnya responsif.
          - `p-0`: Hapus padding agar kita bisa atur di dalam.
        */}
        <div className="relative flex flex-col max-h-[90vh] border-slate-700 bg-slate-900/80 backdrop-blur-sm overflow-hidden text-white rounded-lg">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(#4f5a73_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          <DialogHeader className="p-6 pb-4 flex-shrink-0">
            <DialogTitle className="text-slate-50">Input/Edit Score</DialogTitle>
            <DialogDescription className="text-slate-400">{match.teams?.[0]?.name} vs {match.teams?.[1]?.name}</DialogDescription>
          </DialogHeader>
          
          <form id="score-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 grid gap-6">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="score1" className="text-right font-bold text-slate-200 truncate">{match.teams?.[0]?.name}</Label>
              <Input id="score1" type="number" min="0" value={score1} onChange={(e) => setScore1(e.target.value)} className="col-span-2 h-12 bg-slate-800/70 border-slate-600" placeholder="0" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="score2" className="text-right font-bold text-slate-200 truncate">{match.teams?.[1]?.name}</Label>
              <Input id="score2" type="number" min="0" value={score2} onChange={(e) => setScore2(e.target.value)} className="col-span-2 h-12 bg-slate-800/70 border-slate-600" placeholder="0" />
            </div>
          </form>

          <DialogFooter className="p-6 pt-4 flex-shrink-0 bg-slate-900/50 border-t border-slate-800">
            <Button type="button" variant="destructive" onClick={() => updateScoresMutation.mutate({ s1: null, s2: null })} disabled={updateScoresMutation.isPending}>
              <XCircleIcon className="mr-2 h-4 w-4" /> Reset
            </Button>
            <Button type="submit" form="score-form" disabled={updateScoresMutation.isPending}>
              {updateScoresMutation.isPending ? 'Menyimpan...' : 'Simpan Skor'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScoreDialog;