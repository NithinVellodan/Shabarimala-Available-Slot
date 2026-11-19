import './globals.css';

export const metadata = {
  title: 'Sabarimala Slot Alert | Virtual Q Darshan Availability Monitor',
  description: 'Automated Sabarimala Virtual Q Darshan slot availability monitoring with instant Telegram alerts without requiring portal login.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-saffron-100 selection:text-saffron-900">
        {children}
      </body>
    </html>
  );
}
