// src/components/Schedule.tsx

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
// ... (definisi tipe Match dan Team)
interface Team { id: number; name: string; }
interface Match { id: number; matchday: number; team1_id: number; team2_id: number; score1: number | null; score2: number | null; match_timestamp: string | null; teams: [Team, Team] | null; }
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import SetTimeDialog from './SetTimeDialog';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from './ui/button';

async function getMatchesWithTeams(): Promise<Match[]> {
  // ... (fungsi sama seperti sebelumnya)
  const { data, error } = await supabase.from('matches').select(`*, team1:teams!team1_id(name), team2:teams!team2_id(name)`).order('matchday').order('id');
  if (error) throw error;
  return data.map(m => ({...m, teams: [m.team1, m.team2]})) as Match[];
}

const Schedule: React.FC = () => {
    // ... (logika state sama seperti sebelumnya)
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
            <Accordion type="single" collapsible className="w-full">
                {Object.entries(matchesByDay).map(([day, dayMatches]) => (
                    <AccordionItem value={day} key={day} className="border-b border-slate-700">
                        {/* PERUBAHAN DI SINI */}
                        <AccordionTrigger className="hover:no-underline py-4 transition-colors duration-200 hover:bg-slate-800/50 px-2 rounded-md">
                            {day}
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4 pb-4">
                                {dayMatches.map(match => (
                                    <div key={match.id} className="bg-[#1c2026]/50 p-3 rounded-lg">
                                        
                                        {match.match_timestamp && (
                                            <div className="text-center text-xs text-slate-400 mb-2">
                                                {format(parseISO(match.match_timestamp), 'eeee, dd MMMM yyyy - HH:mm', { locale: id })}
                                            </div>
                                        )}
                                        
                                        <div className="text-slate-300 flex items-center">
                                            <span className="w-2/5 text-right font-semibold truncate">{match.teams?.[0].name}</span>
                                            <div className="w-1/5 text-center">
                                                {match.score1 !== null ? (
                                                    <span className="font-bold text-lg text-white">{`${match.score1} - ${match.score2}`}</span>
                                                ) : (
                                                    <span className="text-xs font-normal text-slate-400">vs</span>
                                                )}
                                            </div>
                                            <span className="w-2/5 text-left font-semibold truncate">{match.teams?.[1].name}</span>
                                        </div>

                                        {match.score1 === null && (
                                            <div className="mt-3 text-center border-t border-slate-700 pt-2">
                                                {/* PERUBAHAN DI SINI */}
                                                <Button
                                                    variant="link"
                                                    className="text-slate-400 h-auto p-0 text-xs hover:text-white transition-colors duration-200"
                                                    onClick={() => setSelectedMatch(match)}
                                                >
                                                    {match.match_timestamp ? 'Ubah Waktu' : 'Atur Waktu Pertandingan'}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
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