import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "@/contextApis/UserContext";
import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] })
const display = Fraunces({ subsets: ['latin'], variable: '--font-display', axes: ['opsz'] })

export const metadata: Metadata = {
  title: 'Symptoms Sense',
  description: 'Describe your symptoms, find the right doctor, book appointments and set medicine reminders.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${display.variable}`}>
        <UserProvider>
          {children}
          <Toaster />
        </UserProvider>
      </body>
    </html>
  )
}