import { Play } from "lucide-react";

const featuredSong = {
  title: "Your Evening Sound",
  description: "A little mellow, a little familiar",
  artwork: "/artwork/blaqbonez.jpeg",
};

function FeaturedCard() {
  return (
    <section className="featured-card">
      <img
        className="featured-artwork"
        src={featuredSong.artwork}
        alt={featuredSong.title}
      />

      <div className="featured-overlay"></div>

      <div className="featured-content">
        <p className="featured-label">TONIGHT</p>

        <h2>{featuredSong.title}</h2>

        <p className="featured-description">{featuredSong.description}</p>

        <button
          type="button"
          className="featured-play"
          aria-label={`Play ${featuredSong.title}`}
        >
          <Play size={20} fill="currentColor" />
        </button>
      </div>
    </section>
  );
}

export default FeaturedCard;
