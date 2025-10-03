// src/components/Schedule.tsx

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import SetTimeDialog from './SetTimeDialog';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Clock, ShieldOff, ChevronDown } from 'lucide-react';

// --- Definisi Tipe Data (Disederhanakan) ---
interface Team {
  id: number;
  name: string;
  logo_url: string | null;
  players_list: string[] | null; // <-- PERUBAHAN: Array of strings
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

// --- Fungsi Fetching Data (Disederhanakan) ---
async function getMatchesWithTeams(): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *, 
      team1:team1_id(name, logo_url, players_list), 
      team2:team2_id(name, logo_url, players_list)
    `) // <-- Query lebih simpel
    .order('matchday')
    .order('id');
  if (error) {
    console.error("Error fetching matches:", error);
    throw error;
  }
  return data.map(m => ({ ...m, teams: [m.team1 as Team, m.team2 as Team] })) as Match[];
}


// ========================================================================
// KOMPONEN: LineupDisplay (DIPERBARUI)
// ========================================================================
interface LineupDisplayProps {
  team1: Team | undefined;
  team2: Team | undefined;
}

const LineupDisplay: React.FC<LineupDisplayProps> = ({ team1, team2 }) => {
  const team1Players = team1?.players_list ?? []; // <-- Menggunakan players_list
  const team2Players = team2?.players_list ?? []; // <-- Menggunakan players_list

  const hasLineup = team1Players.length > 0 || team2Players.length > 0;

  return (
    <div className="bg-slate-900/50 p-3 sm:p-4 rounded-b-lg border-t border-slate-700">
      {!hasLineup ? (
        <p className="text-center text-sm text-slate-400">Line-up belum tersedia.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {/* Kolom Tim 1 */}
          <div className="text-left">
            <h4 className="font-bold text-white mb-2 text-sm">{team1?.name}</h4>
            <ul className="space-y-1 text-xs text-slate-300">
              {team1Players.length > 0 ? team1Players.map((name, index) => <li key={index}>{name}</li>) : <li>-</li>}
            </ul>
          </div>
          {/* Kolom Tim 2 */}
          <div className="text-right">
            <h4 className="font-bold text-white mb-2 text-sm">{team2?.name}</h4>
            <ul className="space-y-1 text-xs text-slate-300">
              {team2Players.length > 0 ? team2Players.map((name, index) => <li key={index}>{name}</li>) : <li>-</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};


// ========================================================================
// KOMPONEN MatchCard (Tidak ada perubahan di sini)
// ========================================================================
interface MatchCardProps {
  match: Match;
  onSetTimeClick: () => void;
  lineupTrigger?: React.ReactNode;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, onSetTimeClick, lineupTrigger }) => {
  const isFinished = match.score1 !== null && match.score2 !== null;
  const team1 = match.teams?.[0];
  const team2 = match.teams?.[1];

  return (
    <div className="bg-slate-800/40 p-3 sm:p-4 rounded-lg border border-slate-700/50 transition-all hover:border-slate-600">
      <div className="flex justify-between items-center mb-2">
        <Badge variant={isFinished ? "secondary" : "default"} className={isFinished ? "bg-green-800/70 text-green-300 border-none" : "bg-blue-800/70 text-blue-300 border-none"}>
          {isFinished ? 'Selesai' : 'Akan Datang'}
        </Badge>
        {lineupTrigger}
      </div>

      {match.match_timestamp && (
        <div className="text-center text-xs text-slate-400 mb-3">
          {format(parseISO(match.match_timestamp), 'eeee, dd MMMM yyyy - HH:mm', { locale: id })}
        </div>
      )}

      <div className="flex items-center">
        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3 min-w-0">
          <span className="font-bold text-white text-right truncate text-sm sm:text-base">{team1?.name}</span>
          {team1?.logo_url ? <img src={team1.logo_url} alt={team1.name} className="w-8 h-8 sm:w-10 sm:h-10 object-contain flex-shrink-0" /> : <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0"><ShieldOff className="w-4 h-4 text-slate-400" /></div>}
        </div>
        <div className="flex justify-center items-center w-16 sm:w-24 flex-shrink-0">
          {isFinished ? <span className="font-bold text-lg sm:text-2xl text-white tracking-wider">{`${match.score1} - ${match.score2}`}</span> : <span className="text-sm font-normal text-slate-400">vs</span>}
        </div>
        <div className="flex flex-1 items-center justify-start gap-2 sm:gap-3 min-w-0">
          {team2?.logo_url ? <img src={team2.logo_url} alt={team2.name} className="w-8 h-8 sm:w-10 sm:h-10 object-contain flex-shrink-0" /> : <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0"><ShieldOff className="w-4 h-4 text-slate-400" /></div>}
          <span className="font-bold text-white text-left truncate text-sm sm:text-base">{team2?.name}</span>
        </div>
      </div>

      {!isFinished && (
        <div className="mt-4 text-center border-t border-slate-700/50 pt-3">
          <Button variant="ghost" className="text-slate-400 h-auto p-2 text-xs hover:text-white transition-colors duration-200" onClick={onSetTimeClick}>
            <Clock className="w-4 h-4 mr-2" />
            {match.match_timestamp ? 'Ubah Waktu' : 'Atur Waktu Pertandingan'}
          </Button>
        </div>
      )}
    </div>
  );
};


// ========================================================================
// KOMPONEN MatchWithLineup (Tidak ada perubahan di sini)
// ========================================================================
interface MatchWithLineupProps {
  match: Match;
  onSetTimeClick: () => void;
}

const MatchWithLineup: React.FC<MatchWithLineupProps> = ({ match, onSetTimeClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="relative">
        <MatchCard
          match={match}
          onSetTimeClick={onSetTimeClick}
          lineupTrigger={
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-700/50">
                Line Up
                <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          }
        />
      </div>
      <CollapsibleContent>
        <LineupDisplay team1={match.teams?.[0]} team2={match.teams?.[1]} />
      </CollapsibleContent>
    </Collapsible>
  );
};


// ========================================================================
// KOMPONEN UTAMA: Schedule (Tidak ada perubahan di sini)
// ========================================================================
const Schedule: React.FC = () => {
    const { data: matches = [], isLoading, isError, error } = useQuery<Match[]>({ queryKey: ['scheduleMatches'], queryFn: getMatchesWithTeams });
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

    if (isLoading) return <div className="p-4 text-center">Loading...</div>;
    if (isError) return <div className="p-4 text-center text-red-500">Error: {error.message}</div>;

    const matchesByDay = matches.reduce((acc, match) => {
        const day = `Matchday ${match.matchday}`;
        if (!acc[day]) acc[day] = [];
        acc[day].push(match);
        return acc;
    }, {} as Record<string, Match[]>);

    if (matches.length === 0) {
        return <div className="p-4 text-center text-slate-400">Belum ada jadwal pertandingan.</div>;
    }

    return (
        <>
            <Accordion type="single" collapsible className="w-full space-y-4">
                {Object.entries(matchesByDay).map(([day, dayMatches]) => (
                    <AccordionItem value={day} key={day} className="border border-slate-700/50 rounded-lg overflow-hidden bg-[#1c2026]">
                        <AccordionTrigger className="hover:no-underline py-3 px-3 sm:px-4 transition-colors duration-200 hover:bg-slate-800/50">
                            <div className='flex justify-between w-full items-center'>
                                <span className='font-bold text-md sm:text-lg text-white'>{day}</span>
                                <span className='text-sm text-slate-400 font-normal mr-2'>{dayMatches.length} Pertandingan</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="bg-black/20">
                            <div className="p-2 sm:p-4 space-y-4">
                                {dayMatches.map(match => (
                                    <MatchWithLineup 
                                        key={match.id} 
                                        match={match} 
                                        onSetTimeClick={() => setSelectedMatch(match)} 
                                    />
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