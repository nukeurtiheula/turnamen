import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
// Menambahkan ikon panah dan strip dari lucide-react
import { Trophy, ArrowUp, ArrowDown, Minus } from 'lucide-react';

// --- Definisi Tipe (Tidak ada perubahan) ---
interface Team { id: number; name: string; }
interface Match { id: number; matchday: number; team1_id: number; team2_id: number; score1: number | null; score2: number | null; match_timestamp: string | null; teams: [Team, Team] | null; }
interface StandingsEntry { team_id: number; team_name: string; mp: number; w: number; d: number; l: number; points: number; gf: number; ga: number; gd: number; }


// --- Komponen RankMedal (Tidak ada perubahan) ---
const RankMedal = ({ rank }: { rank: number }) => {
  if (rank === 1) {
    return <Trophy className="h-5 w-5 text-yellow-400" />;
  }
  if (rank >= 2 && rank <= 3) {
    const color = rank === 2 ? 'bg-slate-400' : 'bg-amber-600';
    return (
      <div className={`flex items-center justify-center w-6 h-6 rounded-full ${color} text-black font-bold text-sm`}>
        {rank}
      </div>
    );
  }
  return <span className="flex items-center justify-center w-6 h-6">{rank}</span>;
};

// --- Komponen BARU untuk Indikator Perubahan Peringkat ---
const RankChangeIndicator = ({ oldRank, newRank }: { oldRank: number, newRank: number }) => {
  // Jika tidak ada data peringkat lama, atau peringkatnya sama, tampilkan strip
  if (oldRank === -1 || oldRank === newRank) {
    return <Minus className="h-4 w-4 text-gray-500" />;
  }
  // Jika peringkat baru lebih baik (lebih kecil), tampilkan panah ke atas
  if (newRank < oldRank) {
    return <ArrowUp className="h-4 w-4 text-green-500" />;
  }
  // Jika peringkat baru lebih buruk (lebih besar), tampilkan panah ke bawah
  return <ArrowDown className="h-4 w-4 text-red-500" />;
};


// --- Fungsi fetchData dan calculateStandings (Tidak ada perubahan) ---
async function fetchData(): Promise<{ teams: Team[], matches: Match[] }> {
    const { data: teams, error: teamsError } = await supabase.from('teams').select('*');
    if (teamsError) throw new Error(teamsError.message);
    const { data: matches, error: matchesError } = await supabase.from('matches').select('*');
    if (matchesError) throw new Error(matchesError.message);
    return { teams, matches };
}

function calculateStandings(teams: Team[], matches: Match[]): StandingsEntry[] {
    const stats = new Map<number, StandingsEntry>(teams.map(t => [t.id, { team_id: t.id, team_name: t.name, mp: 0, w: 0, d: 0, l: 0, points: 0, gf: 0, ga: 0, gd: 0 }]));
    matches.forEach(m => {
        if (m.score1 === null || m.score2 === null) return;
        const s1 = stats.get(m.team1_id);
        const s2 = stats.get(m.team2_id);
        if (!s1 || !s2) return;
        s1.mp++; s2.mp++;
        s1.gf += m.score1; s1.ga += m.score2;
        s2.gf += m.score2; s2.ga += m.score1;
        s1.gd = s1.gf - s1.ga;
        s2.gd = s2.gf - s2.ga;
        if (m.score1 > m.score2) { s1.w++; s1.points += 3; s2.l++; }
        else if (m.score1 < m.score2) { s2.w++; s2.points += 3; s1.l++; }
        else { s1.d++; s1.points++; s2.d++; s2.points++; }
    });
    return Array.from(stats.values()).sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
}


// --- Komponen Utama StandingsTable (Dengan Perubahan) ---
const StandingsTable: React.FC = () => {
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery({ queryKey: ['standingsData'], queryFn: fetchData });
    
    // PERUBAHAN: State untuk menyimpan klasemen sebelumnya
    const [previousStandings, setPreviousStandings] = useState<StandingsEntry[]>([]);

    // Logika subscription realtime (Tidak ada perubahan)
    useEffect(() => {
        const channel = supabase.channel('realtime-matches').on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => { queryClient.invalidateQueries({ queryKey: ['standingsData'] }); }).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [queryClient]);

    // Kalkulasi klasemen saat ini (Tidak ada perubahan)
    const standings = useMemo(() => data ? calculateStandings(data.teams, data.matches) : [], [data]);

    // PERUBAHAN: useEffect untuk menyimpan klasemen saat ini ke 'previousStandings'
    // Ini akan berjalan SETELAH render selesai, sehingga pada render berikutnya,
    // 'previousStandings' akan berisi data dari render yang lalu.
    useEffect(() => {
        if (standings.length > 0) {
            setPreviousStandings(standings);
        }
    }, [standings]);

    if (isLoading) return <div className="p-4 text-center">Loading...</div>;

    return (
        <div className="overflow-hidden rounded-lg border border-gray-800 bg-[#1c2026]/50">
            <Table>
                <TableHeader>
                    <TableRow className="border-b border-gray-800 bg-zinc-700">
                        <TableHead className="text-center w-[100px]">Rank</TableHead>
                        <TableHead>Tim</TableHead>
                        <TableHead className="text-center">MP</TableHead>
                        <TableHead className="text-center">W</TableHead>
                        <TableHead className="text-center">D</TableHead>
                        <TableHead className="text-center">L</TableHead>
                        <TableHead className="text-center">Poin</TableHead>
                        <TableHead className="text-center">Skor Set</TableHead>
                        <TableHead className="text-center">Selisih</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {standings.map((team, index) => {
                        // PERUBAHAN: Cari peringkat lama tim ini
                        const oldRank = previousStandings.findIndex(prevTeam => prevTeam.team_id === team.team_id);
                        
                        return (
                            <TableRow key={team.team_id} className="border-slate-800">
                                <TableCell className="font-medium">
                                  {/* PERUBAHAN: Tampilkan rank medal dan indikator berdampingan */}
                                  <div className="flex items-center justify-center gap-2">
                                    <RankMedal rank={index + 1} />
                                    <RankChangeIndicator oldRank={oldRank} newRank={index} />
                                  </div>
                                </TableCell>
                                <TableCell className="font-semibold">{team.team_name}</TableCell>
                                <TableCell className="text-center">{team.mp}</TableCell>
                                <TableCell className="text-center text-green-500">{team.w}</TableCell>
                                <TableCell className="text-center text-gray-400">{team.d}</TableCell>
                                <TableCell className="text-center text-red-500">{team.l}</TableCell>
                                <TableCell className="text-center font-bold text-lg">{team.points}</TableCell>
                                <TableCell className="text-center">{team.mp > 0 ? `${team.gf}-${team.ga}` : '0-0'}</TableCell>
                                <TableCell className="text-center font-semibold">{team.mp > 0 ? (team.gd > 0 ? `+${team.gd}` : team.gd) : 0}</TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};
export default StandingsTable;
