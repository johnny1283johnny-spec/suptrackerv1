'use client';

import './globals.css';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { href: '/', icon: '🏠', label: '今日' },
  { href: '/supplements', icon: '💊', label: '品項' },
  { href: '/log', icon: '📅', label: '紀錄' },
  { href: '/stats', icon: '📊', label: '統計' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const currentTime = new Date().toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <html lang="zh-TW">
      <head>
        <title>保健食品追蹤紀錄</title>
        <meta name="description" content="追蹤你的每日保健食品服用紀錄" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div className="phone-container">
          <div className="phone-frame">
            <div className="phone-notch" />
            <div className="status-bar">
              <span>{currentTime}</span>
              <span>🔋 💡</span>
            </div>
            <div className="phone-screen">
              {children}
            </div>
            <nav className="bottom-nav">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item${pathname === item.href ? ' active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="home-indicator" />
          </div>
        </div>
      </body>
    </html>
  );
}
