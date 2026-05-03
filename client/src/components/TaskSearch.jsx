export default function TaskSearch({
  keyword,
  placeholder = "Search.....",
  suggestions,
  showSuggestions,
  hidden = false,
  onKeywordChange,
  onSuggestionSelect,
  onAdd,
  children,
}) {
  return (
    <div className="task-header">
      <div className={`task-search-area ${hidden ? "hide" : ""}`}>
        <div className="search-wrapper">
          <div className="search-box">
            <input
              className="task-search-input"
              type="text"
              placeholder={placeholder}
              value={keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
            />
            <i className="fa-solid fa-magnifying-glass" />
          </div>

          {showSuggestions && suggestions.length > 0 ? (
            <div className="search-suggestions" style={{ display: "flex" }}>
              {suggestions.slice(0, 5).map((title) => (
                <button
                  className="search-suggestion-item"
                  type="button"
                  key={title}
                  onClick={() => onSuggestionSelect(title)}
                >
                  {title}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <button
          className="add-task-btn"
          type="button"
          aria-label={placeholder}
          onClick={onAdd}
        >
          <i className="fa-solid fa-plus" />
        </button>
      </div>
      {children}
    </div>
  );
}
