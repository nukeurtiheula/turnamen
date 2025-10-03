// src/components/SetTimeDialog.tsx

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';

// Tipe data dari Schedule.tsx
interface Team {
  id: number;
  name: string;
  logo_url: string | null;
}
interface Match {
  id: number;
  teams: [Team, Team] | null;
  match_timestamp: string | null;
}

interface SetTimeDialogProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatForInput = (date: Date): string => {
  const pad = (num: number) => num.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const SetTimeDialog: React.FC<SetTimeDialogProps> = ({ match, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);

  useEffect(() => {
    if (isOpen && match?.match_timestamp) {
      setSelectedDateTime(new Date(match.match_timestamp));
    } else {
      setSelectedDateTime(null);
    }
  }, [isOpen, match]);

  const mutation = useMutation({
    mutationFn: async (newTimestamp: string | null) => {
      if (!match) throw new Error('Match not selected');
      const { error } = await supabase
        .from('matches')
        .update({ match_timestamp: newTimestamp })
        .eq('id', match.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Waktu pertandingan berhasil diperbarui!');
      queryClient.invalidateQueries({ queryKey: ['scheduleMatches'] });
      onClose();
    },
    onError: (error) => {
      toast.error(`Gagal menyimpan: ${error.message}`);
    },
  });

  const handleSave = () => {
    if (selectedDateTime) {
      mutation.mutate(selectedDateTime.toISOString());
    }
  };
  
  const handleReset = () => {
    mutation.mutate(null);
  };

  if (!match) return null;

  const team1 = match.teams?.[0];
  const team2 = match.teams?.[1];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700">
        <DialogHeader>
          {/* // <-- PERUBAHAN WARNA DI SINI (Judul) */}
          <DialogTitle className="text-slate-50">Atur Waktu Pertandingan</DialogTitle>
          {/* // <-- PERUBAHAN WARNA DI SINI (Deskripsi) */}
          <DialogDescription className="text-slate-300">Pilih tanggal dan waktu untuk pertandingan ini.</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center items-center gap-4 my-4">
          {/* // <-- PERUBAHAN WARNA DI SINI (Nama Tim) */}
          <span className="font-bold text-slate-100">{team1?.name}</span>
          <span className="text-slate-400">vs</span>
          {/* // <-- PERUBAHAN WARNA DI SINI (Nama Tim) */}
          <span className="font-bold text-slate-100">{team2?.name}</span>
        </div>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            {/* // <-- PERUBAHAN WARNA DI SINI (Label) */}
            <label htmlFor="datetime" className="text-right text-slate-200">
              Tanggal & Waktu
            </label>
            <Input
              id="datetime"
              type="datetime-local"
              className="col-span-3 bg-slate-800 border-slate-600 text-white focus:ring-slate-500"
              value={selectedDateTime ? formatForInput(selectedDateTime) : ''}
              onChange={(e) => setSelectedDateTime(e.target.value ? new Date(e.target.value) : null)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="destructive" onClick={handleReset}>
            Reset
          </Button>
          <Button 
            variant="default"
            onClick={handleSave} 
            disabled={!selectedDateTime || mutation.isPending}
          >
            {mutation.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SetTimeDialog;