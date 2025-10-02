// src/components/SetTimeDialog.tsx

import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldOff } from 'lucide-react'; // Import spinner icon

// --- Definisi Tipe Data (salin dari Schedule.tsx) ---
interface Team {
  id: number;
  name: string;
  logo_url: string | null;
}
interface Match {
  id: number;
  matchday: number;
  team1_id: number;
  team2_id: number;
  score1: number | null;
  score2: number | null;
  match_timestamp: string | null;
  teams: [Team, Team] | null;
}

interface SetTimeDialogProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
}

const SetTimeDialog: React.FC<SetTimeDialogProps> = ({ match, isOpen, onClose }) => {
  // State untuk menyimpan nilai input tanggal dan waktu
  const [matchTime, setMatchTime] = useState('');
  // State untuk loading saat menyimpan
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  // useEffect untuk mengatur waktu awal saat dialog dibuka atau match berubah
  useEffect(() => {
    if (match && match.match_timestamp) {
      // Input datetime-local butuh format YYYY-MM-DDTHH:mm
      // Kita potong string ISO untuk mendapatkan format yang benar
      const localTime = new Date(match.match_timestamp).toISOString().slice(0, 16);
      setMatchTime(localTime);
    } else {
      setMatchTime(''); // Reset jika tidak ada waktu
    }
  }, [match]);

  if (!match) return null;

  const team1 = match.teams?.[0];
  const team2 = match.teams?.[1];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('matches')
        .update({ match_timestamp: matchTime })
        .eq('id', match.id);

      if (error) throw error;

      // Jika berhasil, refresh data jadwal dan tutup dialog
      await queryClient.invalidateQueries({ queryKey: ['scheduleMatches'] });
      onClose();
    } catch (error) {
      console.error('Error updating match time:', error);
      // Di aplikasi nyata, tampilkan notifikasi error di sini
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-[#1c2026] border-slate-700">
        <DialogHeader>
          <DialogTitle>Atur Waktu Pertandingan</DialogTitle>
          <DialogDescription>
            Pilih tanggal dan waktu untuk pertandingan ini.
          </DialogDescription>
        </DialogHeader>

        {/* Visual Konteks Pertandingan (Tidak ada perubahan) */}
        <div className="flex items-center justify-center gap-4 py-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{team1?.name}</span>
            {team1?.logo_url ? (
                <img src={team1.logo_url} alt={team1.name} className="w-6 h-6 object-contain" />
            ) : (
                <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center"><ShieldOff className="w-3 h-3 text-slate-400" /></div>
            )}
          </div>
          <span className="text-slate-400">vs</span>
          <div className="flex items-center gap-2">
            {team2?.logo_url ? (
                <img src={team2.logo_url} alt={team2.name} className="w-6 h-6 object-contain" />
            ) : (
                <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center"><ShieldOff className="w-3 h-3 text-slate-400" /></div>
            )}
            <span className="font-semibold text-sm">{team2?.name}</span>
          </div>
        </div>

        {/* Form Input (Tidak ada perubahan) */}
        <div className="grid gap-2">
          <Label htmlFor="match-time" className="text-left text-slate-300">
            Tanggal & Waktu
          </Label>
          <Input
            id="match-time"
            type="datetime-local"
            value={matchTime}
            onChange={(e) => setMatchTime(e.target.value)}
            className="col-span-3 bg-slate-800/50 border-slate-700 focus-visible:ring-slate-500"
          />
        </div>

        {/* ========================================================== */}
        {/* PERUBAHAN DI SINI: DialogFooter dan Tombol Reset */}
        {/* ========================================================== */}
        <DialogFooter>
          <div className="flex w-full justify-end gap-2">
            <Button 
              variant="destructive" 
              onClick={async () => {
                // Set state ke kosong, lalu panggil handleSave untuk menyimpan null ke DB
                setMatchTime('');
                // Kita panggil handleSave secara langsung di sini dengan asumsi
                // state matchTime akan terupdate sebelum handleSave berjalan.
                // Untuk kepastian, kita bisa membuat fungsi handleReset terpisah
                // atau langsung panggil supabase update di sini.
                // Mari kita buat fungsi handleReset agar lebih bersih.
                
                // --- Logika Reset ---
                setIsSaving(true);
                try {
                  const { error } = await supabase
                    .from('matches')
                    .update({ match_timestamp: null }) // Simpan null ke database
                    .eq('id', match.id);
                  if (error) throw error;
                  await queryClient.invalidateQueries({ queryKey: ['scheduleMatches'] });
                  onClose(); // Tutup dialog setelah reset berhasil
                } catch (error) {
                  console.error('Error resetting match time:', error);
                } finally {
                  setIsSaving(false);
                }
              }} 
              disabled={isSaving}
            >
              Reset
            </Button>
            
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

export default SetTimeDialog;