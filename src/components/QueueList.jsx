
import { useRef, useState } from "react";
import { Copy, Trash2 } from "lucide-react";

const SWIPE_DISTANCE = 80;

// One row in the queue. On desktop it has duplicate and remove buttons;
// on a phone, swipe right to duplicate and left to remove.
function QueueRow({ item, onPlay, onDuplicate, onRemove }) {
  const [offset, setOffset] = useState(0);
  const startX = useRef(null);
  const startY = useRef(null);
  const swiping = useRef(false);

  function handleTouchStart(event) {
    startX.current = event.touches[0].clientX;
    startY.current = event.touches[0].clientY;
    swiping.current = false;
  }

  function handleTouchMove(event) {
    if (startX.current === null) return;

    const deltaX = event.touches[0].clientX - startX.current;
    const deltaY = event.touches[0].clientY - startY.current;

    if (
      !swiping.current &&
      Math.abs(deltaX) > 12 &&
      Math.abs(deltaX) > Math.abs(deltaY)
    ) {
      swiping.current = true;
    }

    if (swiping.current) {
      setOffset(Math.max(-120, Math.min(120, deltaX)));
    }
  }

  function handleTouchEnd() {
    if (offset > SWIPE_DISTANCE) onDuplicate(item.qid);
    else if (offset < -SWIPE_DISTANCE) onRemove(item.qid);

    setOffset(0);
    startX.current = null;
    swiping.current = false;
  }

  return (
    <li className="queue-row">
      <div
        className="queue-swipe-hint"
        aria-hidden="true"
        style={{ opacity: offset === 0 ? 0 : 1 }}
      >
        <span>
          <Copy size={16} />
        </span>
        <span>
          <Trash2 size={16} />
        </span>
      </div>

      <div
        className={offset === 0 ? "queue-row-inner" : "queue-row-inner swiping"}
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <button
          type="button"
          className="queue-item"
          onClick={() => onPlay(item.qid)}
        >
          <img src={item.image} alt="" />

          <span>
            <strong>{item.title}</strong>
            <small>{item.artist}</small>
          </span>
        </button>

        <div className="queue-actions">
          <button
            type="button"
            className="icon-btn small"
            onClick={() => onDuplicate(item.qid)}
            aria-label={`Duplicate ${item.title} in the queue`}
          >
            <Copy size={16} />
          </button>

          <button
            type="button"
            className="icon-btn small"
            onClick={() => onRemove(item.qid)}
            aria-label={`Remove ${item.title} from the queue`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </li>
  );
}

function QueueList({
  upNext,
  recommendations,
  onPlayQueued,
  onPlayRecommended,
  onDuplicate,
  onRemove,
}) {
  if (upNext.length > 0) {
    return (
      <>
        <ul className="full-queue-list">
          {upNext.map((item) => (
            <QueueRow
              key={item.qid}
              item={item}
              onPlay={onPlayQueued}
              onDuplicate={onDuplicate}
              onRemove={onRemove}
            />
          ))}
        </ul>

        <p className="queue-hint">
          Swipe right to duplicate a song, or left to remove it.
        </p>
      </>
    );
  }

  return (
    <>
      <p className="queue-empty">No songs left in your queue.</p>

      <div className="queue-recs">
        <div className="queue-recs-head">
          <span className="sonari-sparkle" aria-hidden="true">✦</span>
          <h4>Recommended for you</h4>
        </div>

        {recommendations.length > 0 ? (
          <>
            <p className="queue-recs-sub">
              Based on what you've listened to this session
            </p>

            <ul className="full-queue-list">
              {recommendations.map((song) => (
                <li key={song.id}>
                  <button
                    type="button"
                    className="queue-item"
                    onClick={() => onPlayRecommended(song)}
                  >
                    <img src={song.image} alt="" />

                    <span>
                      <strong>{song.title}</strong>
                      <small>{song.artist}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="queue-recs-sub">
            Play a few more songs and recommendations will show up here.
          </p>
        )}
      </div>
    </>
  );
}

export default QueueList;
