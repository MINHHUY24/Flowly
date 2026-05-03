import { useTranslation } from "react-i18next";

export default function TaskActionToolbar({
  className = "",
  show,
  priorityActive,
  onSelectAll,
  onTogglePriority,
  onSave,
  onComplete,
  onClose,
}) {
  const { t } = useTranslation();

  return (
    <div className={`task-action-toolbar ${className} ${show ? "show" : ""}`}>
      <button type="button" className="toolbar-btn select-all-btn" onClick={onSelectAll}>
        {t("common.selectAll")}
      </button>

      <button
        type="button"
        className={`toolbar-btn priority-btn ${priorityActive ? "active" : ""}`}
        title={t("toolbar.priority")}
        onClick={onTogglePriority}
      >
        <i className="fa-solid fa-flag" />
      </button>

      <button
        type="button"
        className="toolbar-btn save-btn"
        title={t("common.save")}
        onClick={onSave}
      >
        <i className="fa-regular fa-floppy-disk" />
      </button>

      <button
        type="button"
        className="toolbar-btn complete-btn"
        title={t("toolbar.complete")}
        onClick={onComplete}
      >
        <i className="fa-solid fa-check" />
      </button>

      <button
        type="button"
        className="toolbar-btn close-toolbar-btn"
        title={t("common.close")}
        onClick={onClose}
      >
        <i className="fa-solid fa-xmark" />
      </button>
    </div>
  );
}
