// src/pages/AdminPage.tsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
// ... (definisi tipe Match dan Team)
interface Team { id: number; name: string; }
interface Match { id: number; matchday: number; team1_id: number; team2_id: number; score1: number | null; score2: number | null; match_timestamp: string | null; teams: [Team, Team] | null; }
import { Button } from '../components/ui/button';
import { PencilIcon, CalendarClockIcon } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import SetTimeDialog from '../components/SetTimeDialog';
import ScoreDialog from '../components/ScoreDialog';

// ... (fungsi getMatchesWithTeams dan konstanta ADMIN_PASSWORD sama)
const ADMIN_PASSWORD = 'ikhsan347';
async function getMatchesWithTeams(): Promise<Match[]> {
  const { data, error } = await supabase.from('matches').select(`*, team1:teams!team1_id(name), team2:teams!team2_id(name)`).order('matchday').order('id');
  if (error) throw new Error(error.message);
  return data.map(match => ({ ...match, teams: [match.team1, match.team2] })) as Match[];
}

const AdminPage: React.FC = () => {
    // ... (logika state dan useEffect sama)
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [scoreEditMatch, setScoreEditMatch] = useState<Match | null>(null);
    const [timeEditMatch, setTimeEditMatch] = useState<Match | null>(null);
    useEffect(() => {
        const sessionPassword = sessionStorage.getItem('admin-password');
        if (sessionPassword === ADMIN_PASSWORD) { setIsAuthenticated(true); } 
        else {
            const password = prompt("Enter admin password:");
            if (password === ADMIN_PASSWORD) {
                sessionStorage.setItem('admin-password', password);
                setIsAuthenticated(true);
            } else {
                alert("Incorrect password!");
                navigate('/');
            }
        }
    }, [navigate]);

    const { data: matches = [], isLoading } = useQuery<Match[]>({ queryKey: ['matches'], queryFn: getMatchesWithTeams, enabled: isAuthenticated });
    const matchesByDay = matches.reduce((acc, match) => {
        const day = `Matchday ${match.matchday}`;
        if (!acc[day]) acc[day] = [];
        acc[day].push(match);
        return acc;
    }, {} as Record<string, Match[]>);

    if (!isAuthenticated) return <div className="p-4 text-center">Authenticating...</div>;
    if (isLoading) return <div className="p-4 text-center">Loading matches...</div>;

    return (
        <div className="dark container mx-auto p-4 max-w-4xl">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-center">Admin Panel</h1>
                <Button asChild variant="outline"><Link to="/">Kembali ke Halaman Utama</Link></Button>
            </header>

            <Accordion type="single" collapsible className="w-full space-y-2">
                {Object.entries(matchesByDay).map(([day, dayMatches]) => (
                    <AccordionItem value={day} key={day} className="border-none">
                        {/* PERUBAHAN DI SINI */}
                        <AccordionTrigger className="bg-zinc-950 hover:bg-slate-700/50 text-slate-100 px-4 py-3 rounded-lg shadow-sm transition-all duration-300 hover:no-underline">
                            <span className="font-semibold">{day}</span>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2">
                            <div className="space-y-2">
                                {dayMatches.map(match => (
                                    <div key={match.id} className="bg-slate-900/50 p-3 rounded-lg flex items-center justify-between">
                                        <div className="flex-1">
                                            <span className="font-semibold">{match.teams?.[0].name}</span>
                                            <span className="text-sm text-gray-400 mx-2">vs</span>
                                            <span className="font-semibold">{match.teams?.[1].name}</span>
                                        </div>
                                        <div className="text-center w-24">
                                            {match.score1 !== null ? `${match.score1} - ${match.score2}` : 'Pending'}
                                        </div>
                                        <div className="text-right space-x-2">
                                            {/* PERUBAHAN DI SINI */}
                                            <Button variant="ghost" size="icon" className="transition-colors duration-200 hover:bg-slate-700" onClick={() => setTimeEditMatch(match)}>
                                                <CalendarClockIcon className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="transition-colors duration-200 hover:bg-slate-700" onClick={() => setScoreEditMatch(match)}>
                                                <PencilIcon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            {timeEditMatch && (<SetTimeDialog match={timeEditMatch} isOpen={!!timeEditMatch} onClose={() => setTimeEditMatch(null)} />)}
            {scoreEditMatch && (<ScoreDialog match={scoreEditMatch} isOpen={!!scoreEditMatch} onClose={() => setScoreEditMatch(null)} />)}
        </div>
    );
};

export default AdminPage;