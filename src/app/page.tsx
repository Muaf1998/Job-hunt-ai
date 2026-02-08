import Chat from './components/Chat';

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 md:p-8 overflow-hidden select-none">
      {/* Ambient Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[130px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[130px] pointer-events-none" />

      {/* Glass Container */}
      <div className="relative z-10 w-full max-w-5xl h-[90vh] md:h-[85vh] bg-black/40 border border-white/5 rounded-3xl shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col transition-all duration-500 ease-in-out">
        <Chat />
      </div>
    </main>
  );
}
