'use client'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { useState, useEffect } from 'react'

// Logo 1: 簡約圓形彩虹
const Logo1 = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="16" fill="white" stroke="#E5E7EB" strokeWidth="2" />
    <circle cx="20" cy="20" r="12" fill="#FF1F1F" />
    <circle cx="20" cy="20" r="10" fill="#FF9D1F" />
    <circle cx="20" cy="20" r="8" fill="#FFE81F" />
    <circle cx="20" cy="20" r="6" fill="#1FFF1F" />
    <circle cx="20" cy="20" r="4" fill="#1F90FF" />
    <circle cx="20" cy="20" r="2" fill="#9B1FFF" />
  </svg>
)

// Logo 2: 心形彩虹
const Logo2 = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M20 36C20 36 32 27.6 32 20C32 16.4 29.3 14 26 14C23.6 14 21.4 15.3 20 17.3C18.6 15.3 16.4 14 14 14C10.7 14 8 16.4 8 20C8 27.6 20 36 20 36Z"
      fill="#FF1F1F"
    />
    <path
      d="M20 33C20 33 30 25.8 30 19.5C30 16.5 27.8 14.5 25 14.5C23 14.5 21.2 15.6 20 17.3C18.8 15.6 17 14.5 15 14.5C12.2 14.5 10 16.5 10 19.5C10 25.8 20 33 20 33Z"
      fill="#FF9D1F"
    />
    <path
      d="M20 30C20 30 28 24 28 19C28 16.8 26.3 15 24 15C22.4 15 21 15.9 20 17.3C19 15.9 17.6 15 16 15C13.7 15 12 16.8 12 19C12 24 20 30 20 30Z"
      fill="#FFE81F"
    />
    <path
      d="M20 27C20 27 26 22.2 26 18.5C26 16.9 24.8 15.5 23 15.5C21.8 15.5 20.8 16.2 20 17.3C19.2 16.2 18.2 15.5 17 15.5C15.2 15.5 14 16.9 14 18.5C14 22.2 20 27 20 27Z"
      fill="#1FFF1F"
    />
    <path
      d="M20 24C20 24 24 20.4 24 18C24 17 23.3 16 22 16C21.2 16 20.6 16.5 20 17.3C19.4 16.5 18.8 16 18 16C16.7 16 16 17 16 18C16 20.4 20 24 20 24Z"
      fill="#1F90FF"
    />
  </svg>
)

// Logo 3: 蝴蝶結彩虹
const Logo3 = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 8C14 8 10 12 10 16C10 20 14 24 20 24C26 24 30 20 30 16C30 12 26 8 20 8Z" fill="#FF1F1F" />
    <path d="M20 11C15 11 12 14 12 17C12 20 15 22 20 22C25 22 28 20 28 17C28 14 25 11 20 11Z" fill="#FF9D1F" />
    <path d="M20 14C16 14 14 16 14 18C14 20 16 21 20 21C24 21 26 20 26 18C26 16 24 14 20 14Z" fill="#FFE81F" />
    <path
      d="M20 16C17 16 16 17 16 18.5C16 20 17 20.5 20 20.5C23 20.5 24 20 24 18.5C24 17 23 16 20 16Z"
      fill="#1FFF1F"
    />
    <rect x="19" y="24" width="2" height="8" fill="#1F90FF" />
  </svg>
)

// Logo 4: 星星彩虹
const Logo4 = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 4L24.5 16.5L37 20L24.5 23.5L20 36L15.5 23.5L3 20L15.5 16.5L20 4Z" fill="#FF1F1F" />
    <path d="M20 8L23.5 17.5L33 20L23.5 22.5L20 32L16.5 22.5L7 20L16.5 17.5L20 8Z" fill="#FF9D1F" />
    <path d="M20 12L22.5 18.5L29 20L22.5 21.5L20 28L17.5 21.5L11 20L17.5 18.5L20 12Z" fill="#FFE81F" />
    <path d="M20 16L21.5 19.5L25 20L21.5 20.5L20 24L18.5 20.5L15 20L18.5 19.5L20 16Z" fill="#1FFF1F" />
    <circle cx="20" cy="20" r="2" fill="#1F90FF" />
  </svg>
)

// Logo 5: 雲朵彩虹
const Logo5 = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 16C12 13.8 13.8 12 16 12C17.5 12 18.8 12.8 19.5 14C19.8 12.3 21.3 11 23 11C25.2 11 27 12.8 27 15C27 17.2 25.2 19 23 19H16C13.8 19 12 17.2 12 15Z"
      fill="white"
      stroke="#E5E7EB"
      strokeWidth="2"
    />
    <path d="M14 22H26" stroke="#FF1F1F" strokeWidth="2" strokeLinecap="round" />
    <path d="M16 25H24" stroke="#FF9D1F" strokeWidth="2" strokeLinecap="round" />
    <path d="M18 28H22" stroke="#FFE81F" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

type LogoType = typeof Logo1
const Logos: Record<number, LogoType> = {
  1: Logo1,
  2: Logo2,
  3: Logo3,
  4: Logo4,
  5: Logo5
}

export function SiteHeader() {
  const [currentLogo, setCurrentLogo] = useState(2)
  
  const CurrentLogo = Logos[currentLogo]

  const handleLogoClick = () => {
    setCurrentLogo(current => {
      const next = (current % 5) + 1;
      // 添加一個簡單的提示
      const toast = document.createElement('div');
      toast.textContent = `Logo ${next}`;
      toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 10px;
        background: black;
        color: white;
        border-radius: 5px;
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 1000);
      return next;
    });
  }

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '5') {
        setCurrentLogo(Number(e.key));
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-2xl items-center">
        <Link href="/" className="flex items-center gap-2">
          <div 
            className="w-8 h-8 cursor-pointer transition-transform hover:scale-110" 
            onClick={handleLogoClick}
            title="點擊切換 Logo"
          >
            <CurrentLogo />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-transparent bg-clip-text">
            Luvr
          </span>
        </Link>
        <div className="flex items-center ml-auto gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/create">
              <PlusCircle className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/auth">登入</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/auth?tab=register">註冊</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}


