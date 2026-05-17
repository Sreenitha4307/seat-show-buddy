import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Ticket, Calendar, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatPrice, formatShowTime } from "@/lib/format";

export const Route = createFileRoute("/bookings/$bookingId")({ component: Confirmation });

function Confirmation() {
  const { bookingId } = Route.useParams();

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, shows(*, movies(title, poster_url), theaters(name, city, location))")
        .eq("id", bookingId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="container mx-auto py-32 text-center text-muted-foreground">Loading…</div>;
  if (!booking) return <div className="container mx-auto py-32 text-center">Booking not found.</div>;

  const show = booking.shows;

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl animate-fade-in">
      <div className="text-center mb-8 animate-scale-in">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-hero shadow-glow mb-4">
          <CheckCircle2 className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-4xl text-gradient">Booking Confirmed!</h1>
        <p className="text-muted-foreground mt-2">Your tickets have been reserved. Enjoy the show.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-glow">
        <div className="bg-gradient-hero p-5 flex items-start gap-4">
          <img src={show.movies.poster_url} alt={show.movies.title} className="w-20 h-28 rounded-md object-cover border border-white/20" />
          <div className="flex-1 text-primary-foreground">
            <h2 className="font-display text-2xl">{show.movies.title}</h2>
            <p className="text-sm opacity-90 flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{show.theaters.name} · {show.screen}</p>
            <p className="text-sm opacity-90 flex items-center gap-1"><Calendar className="h-3 w-3" />{formatShowTime(show.start_at)}</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Seats</p>
            <div className="flex flex-wrap gap-2">
              {booking.seats.map((s: string) => (
                <span key={s} className="px-3 py-1.5 rounded-md bg-secondary border border-border text-sm font-medium">{s}</span>
              ))}
            </div>
          </div>

          <div className="border-t border-dashed border-border pt-4 flex justify-between items-baseline">
            <span className="text-muted-foreground text-sm">Total paid</span>
            <span className="text-3xl font-display text-gradient">{formatPrice(booking.total_cents)}</span>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">Booking ID</p>
            <p className="font-mono text-xs">{booking.id}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-6 justify-center">
        <Button asChild variant="outline"><Link to="/my-bookings"><Ticket className="h-4 w-4 mr-2" />My Tickets</Link></Button>
        <Button asChild className="bg-gradient-hero border-0"><Link to="/">Browse more</Link></Button>
      </div>
    </div>
  );
}
