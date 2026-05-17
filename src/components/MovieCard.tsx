import { Link } from "@tanstack/react-router";
import { Star, Clock } from "lucide-react";

type Movie = {
  id: string;
  title: string;
  poster_url: string;
  genres: string[];
  language: string;
  duration_min: number;
  rating: number;
};

export function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link
      to="/movies/$movieId"
      params={{ movieId: movie.id }}
      className="group relative block overflow-hidden rounded-xl bg-card border border-border/60 transition-all duration-300 hover:border-primary/60 hover:-translate-y-1 hover:shadow-glow"
    >
      <div className="aspect-[2/3] overflow-hidden bg-muted">
        <img
          src={movie.poster_url}
          alt={movie.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-fade opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <span className="inline-flex items-center gap-1 text-accent">
            <Star className="h-3 w-3 fill-current" />{movie.rating.toFixed(1)}
          </span>
          <span>·</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{movie.duration_min}m</span>
        </div>
        <h3 className="font-display text-lg leading-tight truncate">{movie.title}</h3>
        <p className="text-xs text-muted-foreground mt-1 truncate">{movie.genres.join(" · ")}</p>
      </div>
    </Link>
  );
}
