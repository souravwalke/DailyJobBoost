import { Bricolage_Grotesque } from "next/font/google"
import './globals.css'
import { Toaster } from 'sonner';

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={bricolage.variable}>
      <body className={`font-sans antialiased`}>
        <Toaster richColors position="top-center" />
        {children}
      </body>
    </html>
  );
}
