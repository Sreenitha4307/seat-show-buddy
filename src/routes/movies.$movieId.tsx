import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Star, Clock, Calendar, Globe, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatPrice, formatShowTime } from "@/lib/format";

export const Route = createFileRoute("/movies/$movieId")({ component: MoviePage });

function MoviePage() {
  const { movieId } = Route.useParams();

  const { data: movie, isLoading } = useQuery({
    queryKey: ["movie", movieId],
    queryFn: async () => {
      const { data, error } = await supabase.from("movies").select("*").eq("id", movieId).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  const { data: shows = [] } = useQuery({
    queryKey: ["shows", movieId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shows")
        .select("*, theaters(name, city, location)")
        .eq("movie_id", movieId)
        .order("start_at");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !movie) {
    return <div className="container mx-auto py-32 text-center text-muted-foreground">Loading…</div>;
  }

  // Group shows by theater
  const byTheater = shows.reduce((acc: any, s: any) => {
    const key = s.theater_id;
    if (!acc[key]) acc[key] = { theater: s.theaters, shows: [] };
    acc[key].shows.push(s);
    return acc;
  }, {});

  return (
    <div className="animate-fade-in">
      {/* Banner */}
      <section className="relative h-[55vh] min-h-[400px] overflow-hidden">
        <img src={movie.banner_url || movie.poster_url} alt={movie.title} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
      </section>

      <div className="container mx-auto px-4 -mt-48 relative z-10">
        <div className="grid md:grid-cols-[280px_1fr] gap-8 items-end">
          <img src={movie.poster_url} alt={movie.title} className="w-full rounded-xl shadow-glow border border-border/60" />
          <div className="space-y-4 pb-4">
            <h1 className="text-5xl md:text-7xl text-gradient leading-none">{movie.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1 text-accent"><Star className="h-4 w-4 fill-current" />{movie.rating.toFixed(1)}/10</span>
              <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-4 w-4" />{movie.duration_min} min</span>
              <span className="flex items-center gap-1 text-muted-foreground"><Globe className="h-4 w-4" />{movie.language}</span>
              {movie.released_on && <span className="flex items-center gap-1 text-muted-foreground"><Calendar className="h-4 w-4" />{new Date(movie.released_on).toLocaleDateString()}</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {movie.genres.map((g: string) => (
                <span key={g} className="px-3 py-1 text-xs rounded-full bg-card border border-border/60">{g}</span>
              ))}
            </div>
            <p className="text-muted-foreground max-w-2xl">{movie.description}</p>
          </div>
        </div>

        {/* Trailer */}
        {movie.trailer_url && (
          <section className="mt-12">
            <h2 className="text-2xl mb-4 flex items-center gap-2"><Play className="h-5 w-5 text-primary fill-current" />Trailer</h2>
            <div className="aspect-video rounded-xl overflow-hidden bg-card border border-border/60">
              <iframe src={movie.trailer_url} title="Trailer" allow="autoplay; encrypted-media" allowFullScreen className="w-full h-full" />
            </div>
          </section>
        )}

        {/* Showtimes */}
        <section className="mt-12 mb-20">
          <h2 className="text-3xl mb-6">Theaters &amp; Showtimes</h2>
          {Object.keys(byTheater).length === 0 ? (
            <p className="text-muted-foreground">No shows scheduled.</p>
          ) : (
            <div className="space-y-4">
              {Object.values(byTheater).map((group: any) => (
                <div key={group.theater.name} className="rounded-xl bg-card border border-border/60 p-5 hover:border-primary/40 transition">
                  <div className="flex items-start justify-between mb-4 gap-4">
                    <div>
                      <h3 className="font-display text-xl">{group.theater.name}</h3>
                      <p className="text-sm text-muted-foreground">{group.theater.location} · {group.theater.city}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.shows.map((s: any) => (
                      <Button asChild key={s.id} variant="outline" className="border-primary/40 hover:bg-primary hover:text-primary-foreground">
                        <Link to="/shows/$showId" params={{ showId: s.id }}>
                          {formatShowTime(s.start_at)} · {formatPrice(s.price_cents)}
                        </Link>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
