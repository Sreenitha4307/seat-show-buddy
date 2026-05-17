import { Link, useNavigate } from "@tanstack/react-router";
import { Film, LogOut, Ticket, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative">
            <Film className="h-7 w-7 text-primary transition-transform group-hover:rotate-12" />
            <div className="absolute inset-0 blur-xl bg-primary/40 -z-10" />
          </div>
          <span className="font-display text-2xl tracking-wider">CINE<span className="text-primary">FLUX</span></span>
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/my-bookings"><Ticket className="h-4 w-4 mr-2" />My Tickets</Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button asChild variant="default" size="sm" className="bg-gradient-hero border-0 shadow-glow">
              <Link to="/auth"><UserIcon className="h-4 w-4 mr-2" />Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
