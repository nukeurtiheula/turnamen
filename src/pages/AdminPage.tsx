// src/pages/AdminPage.tsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { PencilIcon, CalendarClockIcon } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import SetTimeDialog from '../components/SetTimeDialog';
import ScoreDialog from '../components/ScoreDialog';

// Tipe data yang konsisten
interface Team {
  id: number;
  name: string;
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

const ADMIN_PASSWORD = 'ikhsan347'; // Ganti dengan password yang aman

// Fungsi fetching data yang lebih robust
async function getMatchesWithTeams(): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select(`*, team1:team1_id(name), team2:team2_id(name)`) // Menggunakan alias untuk kejelasan
    .order('matchday')
    .order('id');
    
  if (error) throw new Error(error.message);
  
  // Memastikan `teams` selalu dalam format array yang diharapkan
  return data.map(match => ({
    ...match,
    teams: [match.team1 as Team, match.team2 as Team]
  })) as Match[];
}

const AdminPage: React.FC = () => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    // State untuk mengontrol dialog mana yang terbuka
    const [scoreEditMatch, setScoreEditMatch] = useState<Match | null>(null);
    const [timeEditMatch, setTimeEditMatch] = useState<Match | null>(null);
    
    useEffect(() => {
        const sessionPassword = sessionStorage.getItem('admin-password');
        if (sessionPassword === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
        } else {
            const password = prompt("Masukkan password admin:");
            if (password === ADMIN_PASSWORD) {
                sessionStorage.setItem('admin-password', password);
                setIsAuthenticated(true);
            } else {
                alert("Password salah!");
                navigate('/');
            }
        }
    }, [navigate]);

    const { data: matches = [], isLoading } = useQuery<Match[]>({
        queryKey: ['matches'],
        queryFn: getMatchesWithTeams,
        enabled: isAuthenticated
    });

    const matchesByDay = matches.reduce((acc, match) => {
        const day = `Matchday ${match.matchday}`;
        if (!acc[day]) acc[day] = [];
        acc[day].push(match);
        return acc;
    }, {} as Record<string, Match[]>);

    if (!isAuthenticated) return <div className="p-4 text-center">Mengautentikasi...</div>;
    if (isLoading) return <div className="p-4 text-center">Memuat pertandingan...</div>;

    return (
        <div className="dark container mx-auto p-4 max-w-4xl">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Admin Panel</h1>
                <Button asChild variant="outline"><Link to="/">Kembali ke Halaman Utama</Link></Button>
            </header>

            <Accordion type="single" collapsible className="w-full space-y-2">
                {Object.entries(matchesByDay).map(([day, dayMatches]) => (
                    <AccordionItem value={day} key={day} className="border-none">
                        <AccordionTrigger className="bg-zinc-950 hover:bg-slate-800/50 text-slate-100 px-4 py-3 rounded-lg shadow-sm transition-all duration-300 hover:no-underline">
                            <span className="font-semibold text-lg">{day}</span>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2">
                            <div className="space-y-2">
                                {dayMatches.map(match => (
                                    <div key={match.id} className="bg-slate-900/50 p-3 rounded-lg flex items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <span className="font-semibold text-slate-50">{match.teams?.[0]?.name ?? 'Tim 1'}</span>
                                            <span className="text-sm text-gray-400 mx-2">vs</span>
                                            <span className="font-semibold text-slate-50">{match.teams?.[1]?.name ?? 'Tim 2'}</span>
                                        </div>
                                        <div className="text-center w-24 font-mono text-lg text-slate-50">
                                            {match.score1 !== null ? `${match.score1} - ${match.score2}` : 'TBA'}
                                        </div>
                                        <div className="flex-shrink-0 space-x-2">
                                            <Button variant="ghost" size="icon" className="transition-colors duration-200 hover:bg-slate-700" onClick={() => setTimeEditMatch(match)}>
                                                <CalendarClockIcon className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="transition-colors duration-200 hover:bg-slate-700" onClick={() => { console.log("--- TOMBOL SKOR DIKLIK! ---"); setScoreEditMatch(match); }} >
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

            {/* Logika render dialog yang aman dan benar */}
            <SetTimeDialog match={timeEditMatch} isOpen={!!timeEditMatch} onClose={() => setTimeEditMatch(null)} />
            <ScoreDialog match={scoreEditMatch} isOpen={!!scoreEditMatch} onClose={() => setScoreEditMatch(null)} />
        </div>
    );
};

export default AdminPage;