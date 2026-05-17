import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Search, Play, TrendingUp } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MovieCard } from "@/components/MovieCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [q, setQ] = useState("");
  const { data: movies = [], isLoading } = useQuery({
    queryKey: ["movies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("movies").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const featured = movies[0];
  const filtered = movies.filter((m) =>
    m.title.toLowerCase().includes(q.toLowerCase()) ||
    m.genres.some((g: string) => g.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      {featured && (
        <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
          <img src={featured.banner_url || featured.poster_url} alt={featured.title} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-transparent" />
          <div className="relative container mx-auto px-4 h-full flex items-end pb-20">
            <div className="max-w-2xl space-y-4 animate-fade-in">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30">
                <TrendingUp className="h-3 w-3" /> NOW SHOWING
              </span>
              <h1 className="text-6xl md:text-8xl text-gradient leading-none">{featured.title}</h1>
              <p className="text-lg text-muted-foreground max-w-xl">{featured.description}</p>
              <div className="flex gap-3 pt-2">
                <Button asChild size="lg" className="bg-gradient-hero border-0 shadow-glow">
                  <Link to="/movies/$movieId" params={{ movieId: featured.id }}>
                    <Play className="h-4 w-4 mr-2 fill-current" /> Book Tickets
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="container mx-auto px-4 py-12 space-y-12">
        {/* Search */}
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search movies, genres..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-12 h-14 text-base bg-card border-border/60 rounded-full"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 justify-center">
          {["All", "Action", "Drama", "Sci-Fi", "Romance", "Thriller", "Animation"].map((c) => (
            <button
              key={c}
              onClick={() => setQ(c === "All" ? "" : c)}
              className="px-4 py-2 rounded-full text-sm border border-border/60 bg-card hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all"
            >{c}</button>
          ))}
        </div>

        {/* Movies grid */}
        <section>
          <h2 className="text-3xl mb-6 flex items-end gap-3">
            Now Showing
            <span className="text-sm text-muted-foreground font-sans tracking-normal mb-1">{filtered.length} films</span>
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-xl bg-card animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
              {filtered.map((m) => <MovieCard key={m.id} movie={m} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
