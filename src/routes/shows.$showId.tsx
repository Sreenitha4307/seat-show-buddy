import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Armchair, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { formatPrice, formatShowTime, seatLabel } from "@/lib/format";

export const Route = createFileRoute("/shows/$showId")({ component: SeatPicker });

function SeatPicker() {
  const { showId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [booking, setBooking] = useState(false);

  const { data: show, isLoading } = useQuery({
    queryKey: ["show", showId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shows")
        .select("*, movies(title, poster_url), theaters(name, city)")
        .eq("id", showId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: takenSeats = [], refetch } = useQuery({
    queryKey: ["seats", showId],
    queryFn: async () => {
      const { data, error } = await supabase.from("booking_seats").select("seat").eq("show_id", showId);
      if (error) throw error;
      return (data ?? []).map((s) => s.seat);
    },
  });

  if (isLoading || !show) return <div className="container mx-auto py-32 text-center text-muted-foreground">Loading…</div>;

  const toggleSeat = (s: string) => {
    if (takenSeats.includes(s)) return;
    setSelected((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const handleBook = async () => {
    if (!user) {
      navigate({ to: "/auth", search: { redirect: `/shows/${showId}` } });
      return;
    }
    if (selected.length === 0) {
      toast.error("Pick at least one seat");
      return;
    }
    setBooking(true);
    const { data, error } = await supabase.rpc("book_seats", { _show_id: showId, _seats: selected });
    setBooking(false);
    if (error) {
      toast.error(error.message);
      refetch();
      setSelected([]);
      return;
    }
    navigate({ to: "/bookings/$bookingId", params: { bookingId: data as string } });
  };

  return (
    <div className="container mx-auto px-4 py-10 animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/movies/$movieId" params={{ movieId: show.movie_id }} className="text-sm text-muted-foreground hover:text-primary">← Back</Link>
          <h1 className="text-4xl mt-2">{show.movies?.title}</h1>
          <p className="text-muted-foreground">{show.theaters?.name} · {show.screen} · {formatShowTime(show.start_at)}</p>
        </div>
        <div className="text-right text-sm text-muted-foreground">Price per seat<br /><span className="text-2xl text-foreground font-display">{formatPrice(show.price_cents)}</span></div>
      </div>

      {/* Screen */}
      <div className="relative my-12 mx-auto max-w-3xl">
        <div className="h-2 bg-gradient-hero rounded-full shadow-glow" />
        <div className="text-center text-xs text-muted-foreground mt-2 tracking-[0.3em]">SCREEN</div>
      </div>

      {/* Seats */}
      <div className="mx-auto w-fit space-y-2 mb-10">
        {Array.from({ length: show.rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-1.5">
            <span className="w-6 text-xs text-muted-foreground text-center">{String.fromCharCode(65 + r)}</span>
            {Array.from({ length: show.cols }).map((_, c) => {
              const s = seatLabel(r, c);
              const isTaken = takenSeats.includes(s);
              const isSel = selected.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleSeat(s)}
                  disabled={isTaken}
                  aria-label={`Seat ${s}${isTaken ? " (booked)" : ""}`}
                  className={`relative h-8 w-8 rounded-md transition-all flex items-center justify-center ${
                    isTaken ? "bg-seat-booked opacity-30 cursor-not-allowed" :
                    isSel ? "bg-seat-selected shadow-glow scale-110" :
                    "bg-seat-available hover:bg-primary/40 hover:scale-110"
                  }`}
                >
                  <Armchair className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 text-xs text-muted-foreground mb-8">
        <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-seat-available" /> Available</span>
        <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-seat-selected" /> Selected</span>
        <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-seat-booked opacity-30" /> Booked</span>
      </div>

      {/* Summary */}
      <div className="sticky bottom-4 mx-auto max-w-3xl glass border border-border rounded-2xl p-5 flex items-center justify-between shadow-glow">
        <div>
          <p className="text-xs text-muted-foreground">{selected.length} seat{selected.length !== 1 ? "s" : ""} · {selected.join(", ") || "Pick your seats"}</p>
          <p className="text-2xl font-display">{formatPrice(show.price_cents * selected.length)}</p>
        </div>
        <Button onClick={handleBook} disabled={booking || selected.length === 0} size="lg" className="bg-gradient-hero border-0 shadow-glow">
          {booking ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Booking…</> : user ? "Confirm Booking" : "Sign in to book"}
        </Button>
      </div>
    </div>
  );
}
