const Magic16Controls = ({
  running = false,
  completed = false,
  onStart,
  onPause,
  onRestart
}) => {
  return (
    <div className="magic16-controls">
      <div className="magic16-buttons">
        {!running && !completed && (
          <button className="magic16-btn magic16-btn-primary" onClick={onStart}>
            ▶ Start
          </button>
        )}

        {running && (
          <button className="magic16-btn magic16-btn-secondary" onClick={onPause}>
            ⏸ Pause
          </button>
        )}

        <button className="magic16-btn magic16-btn-danger" onClick={onRestart}>
          ⏹ Restart
        </button>
      </div>
    </div>
  );
};
export default Magic16Controls;
