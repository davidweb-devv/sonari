
import { House, Search, Library, User } from "lucide-react";
import { usePlayer } from "../store/playerStore";

const NAV_ITEMS = [
  { id: "home", label: "Home", Icon: House },
  { id: "search", label: "Search", Icon: Search },
  { id: "ai", label: "AI", isAi: true },
  { id: "library", label: "Library", Icon: Library },
  { id: "you", label: "You", Icon: User },
];

function Navigation({ activePage, setActivePage }) {
  // The bar slides away while the full-screen player is open.
  const isFullOpen = usePlayer((state) => state.isFullOpen);

  return (
    <nav
      className={isFullOpen ? "bottom-nav hidden" : "bottom-nav"}
      aria-label="Main"
      inert={isFullOpen}
    >
      {NAV_ITEMS.map(({ id, label, Icon, isAi }) => {
        const classes = [
          isAi ? "ai-nav" : "",
          activePage === id ? "active" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <button
            key={id}
            type="button"
            className={classes || undefined}
            aria-current={activePage === id ? "page" : undefined}
            onClick={() => setActivePage(id)}
          >
            {isAi ? (
              <span className="nav-icon sonari-sparkle" aria-hidden="true">
                ✦
              </span>
            ) : (
              <Icon className="nav-icon" aria-hidden="true" />
            )}

            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default Navigation;
