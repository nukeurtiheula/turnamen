// src/components/ScoreDialog.tsx (VERSI AMAN UNTUK TES)

import React from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';

// Tipe data yang konsisten
interface Team { id: number; name: string; }
interface Match { id: number; teams: [Team, Team] | null; }

interface ScoreDialogProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
}

const ScoreDialog: React.FC<ScoreDialogProps> = ({ match, isOpen, onClose }) => {
  
  // Penjaga untuk mencegah error
  if (!match) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="relative border-slate-700 bg-slate-900 text-white">
        <DialogHeader>
          <DialogTitle className="text-slate-50">INI ADALAH TES</DialogTitle>
          <DialogDescription className="text-slate-400">
            Jika popup ini muncul, artinya masalah ada di `useMutation` atau `sonner`.
            <br />
            Pertandingan: {match.teams?.[0]?.name ?? 'Tim 1'} vs {match.teams?.[1]?.name ?? 'Tim 2'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-8 text-center text-2xl font-bold">
          POPUP BERHASIL TAMPIL!
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScoreDialog;