'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function WelcomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePlayNow = () => {
    router.push('/game');
  };

  return (
    <div className="min-h-screen bg-[#312E2B] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Checkerboard pattern background (subtle) */}
      <div className="absolute inset-0 opacity-5">
        <div className="grid grid-cols-16 h-full">
          {Array.from({ length: 256 }).map((_, i) => (
            <div
              key={i}
              className={`${i % 2 === Math.floor(i / 16) % 2 ? 'bg-[#B58863]' : 'bg-[#F0D9B5]'}`}
            />
          ))}
        </div>
      </div>

      {/* Chess pieces floating animation */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 text-6xl text-[#8B6914] opacity-20 animate-float">♔</div>
        <div className="absolute top-40 right-1/4 text-6xl text-[#B58863] opacity-20 animate-float-delayed">♛</div>
        <div className="absolute bottom-40 left-1/3 text-6xl text-[#8B6914] opacity-20 animate-float">♞</div>
        <div className="absolute bottom-20 right-1/3 text-6xl text-[#B58863] opacity-20 animate-float-delayed">♜</div>
      </div>

      <div className={`relative z-10 text-center transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-7xl font-bold mb-4 text-[#F0D9B5]">
            Chess
          </h1>
          <div className="flex items-center justify-center gap-2 text-xl text-[#B58863] mb-2">
            <span>You (White) vs AI (Black)</span>
          </div>
          <p className="text-lg text-[#B58863] max-w-md mx-auto leading-relaxed">
            Challenge the AI in a classic game of chess
          </p>
        </div>

        {/* Play Button */}
        <button
          onClick={handlePlayNow}
          className="group px-12 py-4 text-2xl font-bold text-[#F0D9B5] bg-[#8B6914] border-2 border-[#F0D9B5] rounded hover:bg-[#B58863] transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg"
        >
          <span className="flex items-center gap-3">
            <span>Play Now</span>
          </span>
        </button>

        {/* Additional Info */}
        <div className="mt-12 flex flex-col gap-3 text-[#B58863] text-sm">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-[#8B6914] rounded-full"></div>
            <span>Click a piece, then click a highlighted square to move</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-[#8B6914] rounded-full"></div>
            <span>You play as White • AI plays as Black</span>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-12 bg-[#1a1715] rounded p-6 max-w-md mx-auto border-2 border-[#8B6914]">
          <h3 className="text-lg font-semibold text-[#F0D9B5] mb-3 flex items-center justify-center gap-2">
            <span>💡</span>
            <span>Quick Tips</span>
          </h3>
          <div className="space-y-2 text-sm text-[#B58863] text-left">
            <div className="flex items-start gap-2">
              <span className="text-[#8B6914]">•</span>
              <span>Protect your King at all costs</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#8B6914]">•</span>
              <span>Control the center of the board</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#8B6914]">•</span>
              <span>Develop your pieces early</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-[#8B6914] text-sm">
        Built with Next.js • TypeScript • Tailwind CSS
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
          }
        }

        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-30px) rotate(-10deg);
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }

        .grid-cols-16 {
          grid-template-columns: repeat(16, minmax(0, 1fr));
        }
      `}</style>
    </div>
  );
}
