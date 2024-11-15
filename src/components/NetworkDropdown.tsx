import React, { useState, useEffect, useRef } from "react";
import { useSnapshot } from "valtio";
import { config } from "~/api/config";
import { appState } from "~/App";
import { startTransition } from "react";

const NetworkDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [customSelected, setCustomSelected] = useState(false);
  const appStateSnapshot = useSnapshot(appState);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChainSelect = (key: string) => {
    startTransition(() => {
      // Wrapped the update in startTransition
      appState.chain = {
        id: key,
        ss58Format: null,
        tokenDecimals: null,
        tokenSymbol: null,
      };
      setCustomSelected(false);
      setIsOpen(false);
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-stone-200 text-stone-800 px-3 py-2 text-sm font-medium border border-stone-400 w-full text-left flex justify-between items-center"
      >
        <span>
          {customSelected
            ? "Error"
            : (config.chains[appStateSnapshot.chain.id]?.name ?? "Network")}
        </span>
        <span className="ml-2">▼</span>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-1 w-64 bg-white border border-stone-300 shadow-lg z-10 rounded overflow-hidden">
          {Object.entries(config.chains)
            .filter(([key]) => key.includes("people"))
            .map(([key, net]) => (
              <button
                key={key}
                className="block w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
                onClick={() => handleChainSelect(key)}
              >
                {net.name}
              </button>
            ))}
        </div>
      )}
    </div>
  );
};

export default NetworkDropdown;
