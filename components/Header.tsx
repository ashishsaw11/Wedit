import React, { useState, useRef, useEffect } from 'react';
import { WandIcon, SparklesIcon, HistoryIcon, ALogoIcon, MailIcon, SunIcon, MoonIcon, PhotoStackIcon, VideoIcon, UsersIcon, ChevronDownIcon } from './IconComponents';

type Tab = 'Editor' | 'Combine' | 'Video' | 'Trending' | 'History' | 'Community';
type Theme = 'light' | 'dark';

interface HeaderProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  theme: Theme;
  toggleTheme: () => void;
  onFeedbackClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, theme, toggleTheme, onFeedbackClick }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: 'Editor', label: 'Editor', icon: <WandIcon className="w-5 h-5 mr-3" /> },
    { id: 'Combine', label: 'Combine', icon: <PhotoStackIcon className="w-5 h-5 mr-3" /> },
    { id: 'Video', label: 'Video', icon: <VideoIcon className="w-5 h-5 mr-3" /> },
    { id: 'Trending', label: 'Trending', icon: <SparklesIcon className="w-5 h-5 mr-3" /> },
    { id: 'Community', label: 'Community', icon: <UsersIcon className="w-5 h-5 mr-3" /> },
    { id: 'History', label: 'History', icon: <HistoryIcon className="w-5 h-5 mr-3" /> },
  ];

  const activeNavItem = navItems.find(item => item.id === activeTab);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);


  return (
    <header className="sticky top-0 z-50 py-3 px-4 sm:px-6 border-b border-[var(--border-color)] bg-[var(--card-bg-color)]/80 backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ALogoIcon className="w-8 h-8" />
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight text-[var(--text-color-strong)]">
              Magic Editor
            </h1>
            <p className="text-xs text-[var(--text-color)] -mt-1">by Ashish Kumar Shaw</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 bg-[var(--bg-color)] hover:bg-[var(--border-color)]/50 text-[var(--text-color-strong)]"
                    aria-haspopup="true"
                    aria-expanded={isDropdownOpen}
                >
                    {activeNavItem?.icon}
                    <span className="hidden sm:inline">{activeNavItem?.label}</span>
                    <ChevronDownIcon className={`w-5 h-5 sm:ml-2 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDropdownOpen && (
                    <div 
                      className="absolute top-full mt-2 w-56 origin-top-right right-0 rounded-md bg-[var(--card-bg-color)] shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 animate-fade-in-fast"
                      role="menu"
                      aria-orientation="vertical"
                    >
                        <div className="py-1" role="none">
                            {navItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveTab(item.id as Tab);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`flex items-center w-full px-4 py-2 text-sm text-left transition-colors ${
                                        activeTab === item.id ? 'bg-[var(--accent-color)]/10 text-[var(--accent-color)] font-semibold' : 'text-[var(--text-color)]'
                                    } hover:bg-[var(--border-color)]/50`}
                                    role="menuitem"
                                >
                                    {item.icon}
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <button onClick={onFeedbackClick} className="p-2 rounded-full hover:bg-[var(--border-color)]/50 transition-colors" title="Send Feedback">
                <MailIcon className="w-5 h-5" />
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-[var(--border-color)]/50 transition-colors" title="Toggle Theme">
                {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;