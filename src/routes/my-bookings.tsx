import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { formatPrice, formatShowTime } from "@/lib/format";

export const Route = createFileRoute("/my-bookings")({ component: MyBookings });

function MyBookings() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data: bookings = [] } = useQuery({
    queryKey: ["my-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, shows(*, movies(title, poster_url), theaters(name, city))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in">
      <h1 className="text-4xl mb-8 flex items-center gap-3"><Ticket className="h-8 w-8 text-primary" />My Tickets</h1>
      {bookings.length === 0 ? (
        <p className="text-muted-foreground">No bookings yet. <Link to="/" className="text-primary underline">Browse movies</Link></p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {bookings.map((b: any) => (
            <Link key={b.id} to="/bookings/$bookingId" params={{ bookingId: b.id }} className="flex gap-4 p-4 rounded-xl bg-card border border-border/60 hover:border-primary/60 transition">
              <img src={b.shows.movies.poster_url} alt={b.shows.movies.title} className="w-20 h-28 rounded-md object-cover" />
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-lg truncate">{b.shows.movies.title}</h3>
                <p className="text-xs text-muted-foreground">{b.shows.theaters.name}</p>
                <p className="text-xs text-muted-foreground">{formatShowTime(b.shows.start_at)}</p>
                <p className="text-sm mt-2">Seats: <span className="font-medium">{b.seats.join(", ")}</span></p>
                <p className="text-sm text-accent font-display">{formatPrice(b.total_cents)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
