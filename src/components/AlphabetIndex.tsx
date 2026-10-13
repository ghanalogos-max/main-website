"use client";

const LETTERS = ["#", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

export default function AlphabetIndex({
  activeLetter,
  onSelect,
  availableLetters,
}: {
  activeLetter: string | null;
  onSelect: (letter: string | null) => void;
  availableLetters: Set<string>;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1">
      <div className="flex min-w-max gap-0.5 border-b border-gh-black/10 pb-2 dark:border-white/10">
        {LETTERS.map((letter) => {
          const isAvailable = availableLetters.has(letter);
          const isActive = activeLetter === letter;
          return (
            <button
              key={letter}
              disabled={!isAvailable}
              onClick={() => onSelect(isActive ? null : letter)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-gh-green text-white"
                  : isAvailable
                  ? "text-gh-black/80 hover:bg-gh-gold/30 dark:text-white/80"
                  : "cursor-not-allowed text-gh-black/20 dark:text-white/15"
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
}
