// src/components/SetTimeDialog.tsx

import React, { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
// Definisi tipe lokal untuk bypass
interface Team { id: number; name: string; }
interface Match { id: number; matchday: number; team1_id: number; team2_id: number; score1: number | null; score2: number | null; match_timestamp: string | null; teams: [Team, Team] | null; }
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Form } from './ui/form';

interface SetTimeDialogProps {
  match: Match;
  isOpen: boolean;
  onClose: () => void;
}

const SetTimeDialog: React.FC<SetTimeDialogProps> = ({ match, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);

  const setTimeMutation = useMutation({
    mutationFn: async (isoTimestamp: string | null) => {
      const { data, error } = await supabase
        .from('matches')
        .update({ match_timestamp: isoTimestamp })
        .eq('id', match.id)
        .select();
      if (error) { throw new Error(error.message); }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleMatches'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      onClose();
    },
    onError: (error: any) => {
      alert(`Error: ${error.message}`);
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newTimestamp = formData.get('datetime') as string;

    if (newTimestamp && newTimestamp.length > 0) {
      const date = new Date(newTimestamp);
      if (!isNaN(date.getTime())) {
        setTimeMutation.mutate(date.toISOString());
      } else {
        alert("Format tanggal tidak valid.");
      }
    } else {
      // Jika input dikosongkan, kirim null untuk mereset
      setTimeMutation.mutate(null);
    }
  };

  const handleReset = () => {
    // Panggil mutasi dengan nilai null untuk mereset waktu
    setTimeMutation.mutate(null);
  };

  let defaultValue = '';
  if (match.match_timestamp) {
    try {
      const localDate = new Date(match.match_timestamp);
      const tzoffset = localDate.getTimezoneOffset() * 60000;
      defaultValue = (new Date(localDate.getTime() - tzoffset)).toISOString().slice(0, 16);
    } catch (e) { /* biarkan kosong */ }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="dark bg-card border-slate-700">
        <DialogHeader>
          <DialogTitle>Atur Waktu Pertandingan</DialogTitle>
          <DialogDescription>{match.teams?.[0].name} vs {match.teams?.[1].name}</DialogDescription>
        </DialogHeader>
        
        <Form ref={formRef} onSubmit={handleSubmit}>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="datetime" className="text-right">Waktu</Label>
            <Input
              id="datetime"
              name="datetime"
              type="datetime-local"
              defaultValue={defaultValue}
              className="col-span-3 [color-scheme:light] text-white"
            />
          </div>
          <DialogFooter className="mt-4 justify-between">
            {/* TOMBOL RESET BARU */}
            <Button type="button" variant="destructive" onClick={handleReset} disabled={setTimeMutation.isPending}>
              Reset Waktu
            </Button>
            <Button type="submit" disabled={setTimeMutation.isPending}>
              {setTimeMutation.isPending ? 'Menyimpan...' : 'Simpan Waktu'}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SetTimeDialog;