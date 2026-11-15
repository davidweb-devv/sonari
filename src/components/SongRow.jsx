import { ChevronRight } from "lucide-react";
import SongCard from "./SongCard";
import { usePlayer } from "../store/playerStore";

function SongRow({
  title,
  subtitle,
  songs,
  sectionClassName = "recently-played",
  listClassName = "recently-played-list",
}) { const play = usePlayer((state) => state.play);
  return (
    <section className={sectionClassName}>
      <div className="section-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </div>

        <button type="button" className="see-all">
          See All
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>

      <div className={listClassName}>
        {songs.map((song) => (
          <SongCard key={song.id} song={song} onSelect={(s) => play(s, songs)} />
        ))}
      </div>
    </section>
  );
}

export default SongRow;
