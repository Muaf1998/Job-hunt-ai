import Chat from './components/Chat';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 md:p-8 overflow-hidden select-none">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/background.jpg"
          alt="Background"
          fill
          className="object-cover object-center"
          priority
          quality={100}
        />
        {/* Dark Overlay for readability */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      </div>

      {/* Glass Container */}
      <div className="relative z-10 w-full max-w-5xl h-[90vh] md:h-[85vh] bg-black/40 border border-white/5 rounded-3xl shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col transition-all duration-500 ease-in-out">
        <Chat />
      </div>
    </main>
  );
}
