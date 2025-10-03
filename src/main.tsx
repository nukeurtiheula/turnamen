// src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner'; // <-- 1. IMPORT KOMPONEN TOASTER

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        {/* ====================================================== */}
        {/* ===== DAN TAMBAHKAN TOASTER DI SINI 👇 ===== */}
        {/* ====================================================== */}
        <Toaster theme="dark" position="bottom-right" /> {/* <-- 2. LETAKKAN KOMPONEN TOASTER DI SINI */}
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);