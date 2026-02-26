'use client';

const emojiRatings = [
    { value: 1, emoji: '😡', label: 'Poor' },
    { value: 2, emoji: '😔', label: 'Below Average' },
    { value: 3, emoji: '😐', label: 'Average' },
    { value: 4, emoji: '😊', label: 'Above Average' },
    { value: 5, emoji: '😍', label: 'Exceptional' },
];

export function EmojiRatingGroup({ title, selected, onChange }) {
    return (
        <div className="emoji-rating-group">
            <p className="emoji-rating-group__title">{title}</p>
            <div className="emoji-rating-group__scale">
                {emojiRatings.map((item) => {
                    const isActive = selected === item.value;
                    return (
                        <button
                            key={item.value}
                            type="button"
                            className={`emoji-btn ${isActive ? 'emoji-btn--active' : ''}`}
                            onClick={() => onChange(item.value)}
                            aria-label={`${title}: ${item.value} ${item.label}`}
                        >
                            <span className="emoji-btn__icon">{item.emoji}</span>
                            <span className="emoji-btn__label">{item.label}</span>
                        </button>
                    );
                })}
            </div>

            <style jsx>{`
        .emoji-rating-group {
          margin-bottom: 24px;
        }
        .emoji-rating-group__title {
          font-size: 18px;
          font-weight: 700;
          color: var(--gray-800);
          text-align: center;
          margin-bottom: 16px;
        }
        .emoji-rating-group__scale {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .emoji-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 80px;
          padding: 8px;
          background: transparent;
          border: 2px solid transparent;
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .emoji-btn:hover {
          background: var(--gray-50);
        }
        .emoji-btn--active {
          border-color: var(--blue-500);
          background: var(--blue-50);
        }
        .emoji-btn__icon {
          font-size: 32px;
          line-height: 1;
          margin-bottom: 4px;
        }
        .emoji-btn__label {
          font-size: 11px;
          font-weight: 500;
          color: var(--gray-500);
          text-align: center;
          line-height: 1.2;
        }
        .emoji-btn--active .emoji-btn__label {
          color: var(--blue-600);
          font-weight: 600;
        }

        @media (max-width: 480px) {
          .emoji-btn {
            width: 68px;
          }
          .emoji-btn__icon {
            font-size: 28px;
          }
          .emoji-btn__label {
            font-size: 10px;
          }
        }
      `}</style>
        </div>
    );
}
