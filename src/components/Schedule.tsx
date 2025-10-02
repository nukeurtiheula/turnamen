// src/components/Schedule.tsx

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import SetTimeDialog from './SetTimeDialog';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from './ui/button';
import { Badge } from './ui/badge'; // Import Badge dari shadcn/ui
import { Clock, ShieldOff } from 'lucide-react'; // Import ikon

// --- Definisi Tipe Data ---
interface Team {
  id: number;
  name: string;
  logo_url: string | null; // Tambahkan logo_url
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

// --- Fungsi Fetching Data (Sudah dimodifikasi) ---
async function getMatchesWithTeams(): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      team1:team1_id(name, logo_url),
      team2:team2_id(name, logo_url)
    `)
    .order('matchday')
    .order('id');
    
  if (error) {
    console.error("Error fetching matches:", error); // Tambahkan ini untuk debugging
    throw error;
  }
  
  // Sekarang data akan kembali dengan format { ..., team1: {name: '...'}, team2: {name: '...'} }
  // Kita perlu menyesuaikan sedikit cara kita memetakannya
  return data.map(m => ({ ...m, teams: [m.team1 as Team, m.team2 as Team] })) as Match[];
}

// ========================================================================
// KOMPONEN BARU: MatchCard
// ========================================================================
interface MatchCardProps {
  match: Match;
  onSetTimeClick: () => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, onSetTimeClick }) => {
  const isFinished = match.score1 !== null && match.score2 !== null;
  const team1 = match.teams?.[0];
  const team2 = match.teams?.[1];

  return (
    <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/50 transition-all hover:border-slate-600">
      {/* Header Kartu: Status & Waktu */}
      <div className="flex justify-between items-center mb-3">
        <Badge variant={isFinished ? "secondary" : "default"} className={isFinished ? "bg-green-800/70 text-green-300 border-none" : "bg-blue-800/70 text-blue-300 border-none"}>
          {isFinished ? 'Selesai' : 'Akan Datang'}
        </Badge>
        {match.match_timestamp && (
          <div className="text-xs text-slate-400">
            {format(parseISO(match.match_timestamp), 'dd MMM yyyy, HH:mm', { locale: id })}
          </div>
        )}
      </div>

      {/* Konten Utama: Tim vs Tim */}
      <div className="flex items-center justify-between gap-4">
        {/* Tim 1 */}
        <div className="flex items-center gap-3 w-2/5 justify-end">
          <span className="font-bold text-white text-right truncate">{team1?.name}</span>
          {team1?.logo_url ? (
            <img src={team1.logo_url} alt={team1.name} className="w-8 h-8 object-contain" />
          ) : (
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center"><ShieldOff className="w-4 h-4 text-slate-400" /></div>
          )}
        </div>

        {/* Skor atau VS */}
        <div className="text-center">
          {isFinished ? (
            <span className="font-bold text-2xl text-white tracking-wider">{`${match.score1} - ${match.score2}`}</span>
          ) : (
            <span className="text-sm font-normal text-slate-400">vs</span>
          )}
        </div>

        {/* Tim 2 */}
        <div className="flex items-center gap-3 w-2/5">
          {team2?.logo_url ? (
            <img src={team2.logo_url} alt={team2.name} className="w-8 h-8 object-contain" />
          ) : (
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center"><ShieldOff className="w-4 h-4 text-slate-400" /></div>
          )}
          <span className="font-bold text-white text-left truncate">{team2?.name}</span>
        </div>
      </div>

      {/* Tombol Aksi (jika belum selesai) */}
      {!isFinished && (
        <div className="mt-3 text-center border-t border-slate-700/50 pt-3">
          <Button
            variant="ghost"
            className="text-slate-400 h-auto p-2 text-xs hover:text-white transition-colors duration-200"
            onClick={onSetTimeClick}
          >
            <Clock className="w-4 h-4 mr-2" />
            {match.match_timestamp ? 'Ubah Waktu' : 'Atur Waktu Pertandingan'}
          </Button>
        </div>
      )}
    </div>
  );
};


// ========================================================================
// KOMPONEN UTAMA: Schedule
// ========================================================================
const Schedule: React.FC = () => {
    const { data: matches = [], isLoading } = useQuery<Match[]>({ queryKey: ['scheduleMatches'], queryFn: getMatchesWithTeams });
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

    if (isLoading) return <div className="p-4 text-center">Loading...</div>;

    const matchesByDay = matches.reduce((acc, match) => {
        const day = `Matchday ${match.matchday}`;
        if (!acc[day]) acc[day] = [];
        acc[day].push(match);
        return acc;
    }, {} as Record<string, Match[]>);

    return (
        <>
            <Accordion type="single" collapsible className="w-full space-y-4">
                {Object.entries(matchesByDay).map(([day, dayMatches]) => (
                    <AccordionItem value={day} key={day} className="border border-slate-700/50 rounded-lg overflow-hidden bg-slate-900/30">
                        <AccordionTrigger className="hover:no-underline py-3 px-4 transition-colors duration-200 hover:bg-slate-800/50">
                            <div className='flex justify-between w-full items-center'>
                                <span className='font-bold text-lg text-white'>{day}</span>
                                <span className='text-sm text-slate-400 font-normal mr-2'>{dayMatches.length} Pertandingan</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="bg-slate-900/20">
                            <div className="p-4 space-y-4">
                                {dayMatches.map(match => (
                                    <MatchCard key={match.id} match={match} onSetTimeClick={() => setSelectedMatch(match)} />
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            {selectedMatch && ( <SetTimeDialog match={selectedMatch} isOpen={!!selectedMatch} onClose={() => setSelectedMatch(null)} /> )}
        </>
    );
};

export default Schedule;
