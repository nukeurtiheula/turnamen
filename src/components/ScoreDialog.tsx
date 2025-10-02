// src/components/ScoreDialog.tsx

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
// Definisi tipe lokal untuk bypass
interface Team { id: number; name: string; }
interface Match { id: number; matchday: number; team1_id: number; team2_id: number; score1: number | null; score2: number | null; match_timestamp: string | null; teams: [Team, Team] | null; }
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Form, FormField } from './ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { XCircleIcon } from 'lucide-react';

interface ScoreDialogProps {
  match: Match;
  isOpen: boolean;
  onClose: () => void;
}

const ScoreDialog: React.FC<ScoreDialogProps> = ({ match, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [score1, setScore1] = useState<number | ''>(match.score1 ?? '');
  const [score2, setScore2] = useState<number | ''>(match.score2 ?? '');

  const updateScoresMutation = useMutation({
    mutationFn: async (scores: { s1: number | null, s2: number | null }) => {
      const { error } = await supabase.from('matches').update({ score1: scores.s1, score2: scores.s2 }).eq('id', match.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['scheduleMatches'] });
      queryClient.invalidateQueries({ queryKey: ['standingsData'] });
      onClose();
    },
    onError: (error) => alert(`Error: ${error.message}`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateScoresMutation.mutate({ s1: score1 === '' ? null : Number(score1), s2: score2 === '' ? null : Number(score2) });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="dark bg-card border-slate-700">
        <DialogHeader>
          <DialogTitle>Input/Edit Score</DialogTitle>
          <DialogDescription>{match.teams?.[0].name} vs {match.teams?.[1].name}</DialogDescription>
        </DialogHeader>
        <Form onSubmit={handleSubmit}>
          <FormField>
            <Label htmlFor="score1">{match.teams?.[0].name} Score</Label>
            <Input 
              id="score1" 
              type="number" 
              min="0" 
              value={score1} 
              onChange={(e) => setScore1(e.target.value === '' ? '' : Number(e.target.value))} 
              className="text-white" // <-- PERUBAHAN DI SINI
            />
          </FormField>
          <FormField>
            <Label htmlFor="score2">{match.teams?.[1].name} Score</Label>
            <Input 
              id="score2" 
              type="number" 
              min="0" 
              value={score2} 
              onChange={(e) => setScore2(e.target.value === '' ? '' : Number(e.target.value))}
              className="text-white" // <-- DAN DI SINI
            />
          </FormField>
          <DialogFooter className="mt-4">
            <Button type="button" variant="destructive" onClick={() => updateScoresMutation.mutate({ s1: null, s2: null })} disabled={updateScoresMutation.isPending}>
              <XCircleIcon className="mr-2 h-4 w-4" /> Reset
            </Button>
            <Button type="submit" disabled={updateScoresMutation.isPending}>
              {updateScoresMutation.isPending ? 'Menyimpan...' : 'Simpan Skor'}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ScoreDialog;