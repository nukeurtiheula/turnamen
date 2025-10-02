import React from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import StandingsTable from '../components/StandingsTable';
import Schedule from '../components/Schedule';
import { Button } from '../components/ui/button';

const HomePage: React.FC = () => {
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6">
      <header className="mb-8 text-center relative">
  {/* Indikator LIVE sekarang diposisikan secara absolut */}
  <div className="absolute top-0 right-0 flex items-center space-x-2 text-sm text-green-400">
    <span className="relative flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
    </span>
    <span>LIVE</span>
  </div>
<h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase">
  Klasemen Turnamen 
  <span className="block font-bold text-lg tracking-wider">One For All Season II</span>
</h1>
  <p className="mt-2 text-sm text-gray-400">UPDATE KLASEMEN.</p>
</header>
      
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={handleRefresh}>Refresh Klasemen</Button>
        <Button asChild variant="secondary">
          <Link to="/admin">Ruang Admin</Link>
        </Button>
      </div>

      <section className="mb-12">
        <StandingsTable />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4 text-center">
          Jadwal Pertandingan
        </h2>
        <Schedule />
      </section>
    </div>
  );
};


export default HomePage;
