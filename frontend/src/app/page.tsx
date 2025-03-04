"use client";
import { Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useState } from "react";
import { toast } from "sonner";

export default function Home() {
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !timezone) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, timezone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to subscribe");
      }

      toast.success("Successfully subscribed! Check your email for confirmation.");
      setEmail("");
      setTimezone("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to subscribe");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-white to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 z-0" />
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 dark:bg-blue-700 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 dark:bg-purple-700 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-40 left-1/3 w-72 h-72 bg-yellow-200 dark:bg-yellow-700 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      </div>
      <div className="relative z-10 flex flex-col flex-1">
        <header className="container mx-auto pt-6 px-4">
          <div className="flex items-center justify-center">
            <h1 className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              HypeMeUp
            </h1>
          </div>
        </header>
        <main className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
          <div className="max-w-3xl w-full space-y-12 animate-fade-in"> 
            <div className="space-y-12">
              <div className="relative max-w-2xl mx-auto">
                <figure className="space-y-6">
                  <blockquote className="text-2xl md:text-3xl lg:text-4xl font-medium tracking-tight text-slate-800 dark:text-slate-200 leading-relaxed relative px-12">
                    "The win is coming, don&apos;t let the when worry you"
                  </blockquote>
                  <figcaption className="text-slate-600 dark:text-slate-400">
                    <span className="font-medium">Daily Motivation</span>
                  </figcaption>
                </figure>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 max-w-md mx-auto w-full">
                <div className="space-y-6">
                  <div className="space-y-2 text-left">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      Start Your Day Inspired
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                    Ignite your potential with daily affirmations that empower you to take charge and thrive every day.
                    </p>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-left block text-slate-700 dark:text-slate-300">
                        Email
                      </label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="you@example.com" 
                        className="w-full"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="timezone" className="text-sm font-medium text-left block text-slate-700 dark:text-slate-300">
                        Your Timezone
                      </label>
                      <Select value={timezone} onValueChange={setTimezone}>
                        <SelectTrigger id="timezone" className="w-full">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/Los_Angeles">Pacific Time (PST/PDT)</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time (MST/MDT)</SelectItem>
                          <SelectItem value="America/Chicago">Central Time (CST/CDT)</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time (EST/EDT)</SelectItem>
                          <SelectItem value="GMT">Greenwich Mean Time (GMT)</SelectItem>
                          <SelectItem value="Europe/Paris">Central European Time (CET)</SelectItem>
                          <SelectItem value="Asia/Kolkata">India Standard Time (IST)</SelectItem>
                          <SelectItem value="Asia/Tokyo">Japan Standard Time (JST)</SelectItem>
                          <SelectItem value="Australia/Sydney">Australian Eastern Time (AEST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 hover:shadow-md"
                      disabled={isLoading}
                    >
                      {isLoading ? "Subscribing..." : "Subscribe"}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </main>
        <footer className="container mx-auto py-6 px-4 text-center text-slate-500 dark:text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} HypeMeUp. Made with ❤️ by Sourav Walke.</p>
        </footer>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
