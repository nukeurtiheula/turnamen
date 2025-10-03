// src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner'; // <-- Import Toaster tetap ada

// TIDAK ADA LAGI 'import "sonner/dist/sonner.css";' DI SINI

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster theme="dark" position="bottom-right" /> {/* <-- Komponen Toaster tetap ada */}
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);