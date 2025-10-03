// src/components/ScoreDialog.tsx

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
// Definisi tipe lokal
interface Team { id: number; name: string; }
interface Match { id: number; matchday: number; team1_id: number; team2_id: number; score1: number | null; score2: number | null; match_timestamp: string | null; teams: [Team, Team] | null; }
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { XCircleIcon } from 'lucide-react';
import { toast } from 'sonner'; // <-- Direkomendasikan untuk notifikasi yang lebih baik

interface ScoreDialogProps {
  match: Match;
  isOpen: boolean;
  onClose: () => void;
}

const ScoreDialog: React.FC<ScoreDialogProps> = ({ match, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  // Gunakan string untuk state agar lebih fleksibel
  const [score1, setScore1] = useState('');
  const [score2, setScore2] = useState('');
  
  // Sinkronisasi state saat dialog dibuka
  useEffect(() => {
    if (isOpen && match) {
        setScore1(match.score1?.toString() ?? '');
        setScore2(match.score2?.toString() ?? '');
    }
  }, [isOpen, match]);


  const updateScoresMutation = useMutation({
    mutationFn: async (scores: { s1: number | null, s2: number | null }) => {
      const { error } = await supabase.from('matches').update({ score1: scores.s1, score2: scores.s2 }).eq('id', match.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Skor berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['scheduleMatches'] });
      queryClient.invalidateQueries({ queryKey: ['standingsData'] });
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* // <-- PERUBAHAN UTAMA DI SINI: Background dan style popup */}
      <DialogContent className="relative border-slate-700 bg-slate-900/80 backdrop-blur-sm overflow-hidden text-white">
        {/* Pola dot-grid di belakang konten */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(#4f5a73_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <DialogHeader>
          <DialogTitle className="text-slate-50">Input/Edit Score</DialogTitle>
          <DialogDescription className="text-slate-400">
            {match.teams?.[0].name} vs {match.teams?.[1].name}
          </DialogDescription>
        </DialogHeader>
        
        {/* // <-- PERUBAHAN UTAMA DI SINI: Layout form yang lebih jelas */}
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          
          {/* Input untuk Tim 1 */}
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="score1" className="text-right font-bold text-slate-200 truncate">
              {match.teams?.[0].name}
            </Label>
            <Input 
              id="score1" 
              type="number" 
              min="0" 
              value={score1} 
              onChange={(e) => setScore1(e.target.value)} 
              className="col-span-2 h-12 bg-slate-800/70 border-slate-600 text-white text-lg placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 focus-visible:ring-offset-slate-900"
              placeholder="0"
            />
          </div>

          {/* Input untuk Tim 2 */}
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="score2" className="text-right font-bold text-slate-200 truncate">
              {match.teams?.[1].name}
            </Label>
            <Input 
              id="score2" 
              type="number" 
              min="0" 
              value={score2} 
              onChange={(e) => setScore2(e.target.value)}
              className="col-span-2 h-12 bg-slate-800/70 border-slate-600 text-white text-lg placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 focus-visible:ring-offset-slate-900"
              placeholder="0"
            />
          </div>

          <DialogFooter className="mt-4 col-span-3">
            <Button type="button" variant="destructive" onClick={() => updateScoresMutation.mutate({ s1: null, s2: null })} disabled={updateScoresMutation.isPending}>
              <XCircleIcon className="mr-2 h-4 w-4" /> Reset
            </Button>
            <Button type="submit" disabled={updateScoresMutation.isPending}>
              {updateScoresMutation.isPending ? 'Menyimpan...' : 'Simpan Skor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScoreDialog;