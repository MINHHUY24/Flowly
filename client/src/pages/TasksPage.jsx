import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { apiRequest } from "../api/apiClient";
import { getDateFullKey } from "../utils/date";

const STATUS_COLUMNS = [
  { key: "new", labelKey: "tasks.statuses.new" },
  { key: "doing", labelKey: "tasks.statuses.doing" },
  { key: "paused", labelKey: "tasks.statuses.paused" },
  { key: "done", labelKey: "tasks.statuses.done", collapsible: true },
  { key: "cancelled", labelKey: "tasks.statuses.cancelled", collapsible: true },
];

const TAG_COLORS = [
  { key: "orange", labelKey: "tasks.tagColors.orange" },
  { key: "red", labelKey: "tasks.tagColors.red" },
  { key: "green", labelKey: "tasks.tagColors.green" },
];

const PRIORITY_BY_STAR = {
  0: "normal",
  1: "low",
  2: "medium",
  3: "high",
};

function formatTaskDate(value, language, noDateLabel) {
  if (!value) return noDateLabel;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(language === "en" ? "en-US" : "vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeStatus(status) {
  return STATUS_COLUMNS.some((column) => column.key === status) ? status : null;
}

function getPriorityStarCount(priority) {
  if (priority === "urgent" || priority === "high") return 3;
  if (priority === "medium") return 2;
  if (priority === "low") return 1;
  return 0;
}

function emptyTaskModalState() {
  return {
    open: false,
    editingId: null,
    title: "",
    date: getDateFullKey(new Date()),
    description: "",
    priorityLevel: 0,
    hoverPriorityLevel: 0,
    tagColor: "",
  };
}

function AddTaskModal({ modal, onChange, onClose, onSubmit }) {
  const { t } = useTranslation();

  const previewLevel =
    modal.hoverPriorityLevel > 0
      ? modal.hoverPriorityLevel
      : modal.priorityLevel;

  return (
    <div
      className={`task-add-modal-overlay ${modal.open ? "show" : ""}`}
      onClick={onClose}
    >
      <div
        className="task-add-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="task-add-modal-title">
          {modal.editingId ? t("tasks.editTask") : t("tasks.addTask")}
        </h2>

        <form className="task-add-modal-form" onSubmit={onSubmit}>
          <div className="task-add-modal-left">
            <label className="task-add-input-group">
              <i className="fa-regular fa-clipboard" />
              <input
                type="text"
                placeholder={t("tasks.taskName")}
                value={modal.title}
                onChange={(event) => onChange({ title: event.target.value })}
              />
            </label>

            <label className="task-add-input-group">
              <i className="fa-regular fa-calendar-days" />
              <input
                type="date"
                value={modal.date}
                onChange={(event) => onChange({ date: event.target.value })}
              />
            </label>

            <label className="task-add-input-group task-add-desc-group">
              <i className="fa-regular fa-message" />
              <textarea
                placeholder={t("tasks.description")}
                value={modal.description}
                onChange={(event) =>
                  onChange({ description: event.target.value })
                }
              />
            </label>
          </div>

          <div className="task-add-modal-right">
            <div className="task-add-tags">
              <p>{t("tasks.tags")}</p>

              <div className="task-add-tag-lines">
                {TAG_COLORS.map((tag) => (
                  <button
                    className={`tag-line ${tag.key} ${
                      modal.tagColor === tag.key ? "active" : ""
                    }`}
                    type="button"
                    key={tag.key}
                    aria-label={t("tasks.selectTag", {
                      label: t(tag.labelKey),
                    })}
                    onClick={() => onChange({ tagColor: tag.key })}
                  />
                ))}
              </div>
            </div>

            <div className="task-add-priority">
              <p>{t("tasks.priority")}</p>

              <div
                className="task-priority-picker"
                onMouseLeave={() => onChange({ hoverPriorityLevel: 0 })}
              >
                {[1, 2, 3].map((level) => (
                  <button
                    className="task-priority-star"
                    type="button"
                    key={level}
                    aria-label={t("tasks.selectPriority", { level })}
                    onMouseEnter={() => onChange({ hoverPriorityLevel: level })}
                    onFocus={() => onChange({ hoverPriorityLevel: level })}
                    onBlur={() => onChange({ hoverPriorityLevel: 0 })}
                    onClick={() =>
                      onChange({
                        priorityLevel:
                          modal.priorityLevel === level ? 0 : level,
                        hoverPriorityLevel: 0,
                      })
                    }
                  >
                    <i
                      className={
                        level <= previewLevel
                          ? "fa-solid fa-star"
                          : "fa-regular fa-star"
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="task-add-modal-actions">
              <button
                className="task-add-cancel-btn"
                type="button"
                onClick={onClose}
              >
                {t("common.cancel")}
              </button>

              <button className="task-add-submit-btn" type="submit">
                {modal.editingId ? t("common.save") : t("common.add")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { t, i18n } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverStatus, setDragOverStatus] = useState(null);
  const [expandedColumns, setExpandedColumns] = useState(new Set());
  const [taskModal, setTaskModal] = useState(() => emptyTaskModalState());
  const [hoveredPriorityById, setHoveredPriorityById] = useState({});

  const boardRef = useRef(null);
  const cardDragBlockedRef = useRef(false);
  const columnRefs = useRef({});

  const tasksByStatus = useMemo(() => {
    return STATUS_COLUMNS.reduce((map, column) => {
      map[column.key] = tasks.filter(
        (task) => normalizeStatus(task.status) === column.key,
      );
      return map;
    }, {});
  }, [tasks]);

  const loadKanbanTasks = useCallback(async () => {
    try {
      const result = await apiRequest("/api/tasks");
      setTasks(result.tasks || []);
    } catch (error) {
      console.log("Load kanban error:", error);
    }
  }, []);

  useEffect(() => {
    loadKanbanTasks();
  }, [loadKanbanTasks]);

  useEffect(() => {
    function handleChatbotCreated(event) {
      const detail = event.detail || {};

      if (detail.type !== "tasks") return;

      loadKanbanTasks();
    }

    window.addEventListener("flowly-chatbot-created", handleChatbotCreated);

    return () => {
      window.removeEventListener(
        "flowly-chatbot-created",
        handleChatbotCreated,
      );
    };
  }, [loadKanbanTasks]);

  function scrollToColumn(status) {
    window.requestAnimationFrame(() => {
      const board = boardRef.current;
      const column = columnRefs.current[status];

      if (!board || !column) return;

      const boardRect = board.getBoundingClientRect();
      const columnRect = column.getBoundingClientRect();

      const nextScrollLeft =
        board.scrollLeft + columnRect.left - boardRect.left - 24;

      board.scrollTo({
        left: nextScrollLeft,
        behavior: "smooth",
      });
    });
  }

  function openAddTaskModal() {
    setTaskModal({
      ...emptyTaskModalState(),
      open: true,
    });
  }

  function closeAddTaskModal() {
    setTaskModal(emptyTaskModalState());
  }

  function openEditTaskModal(task) {
    setTaskModal({
      open: true,
      editingId: task.id,
      title: task.title || "",
      date:
        String(task.task_date || "").slice(0, 10) ||
        getDateFullKey(new Date()),
      description: task.description || "",
      priorityLevel: getPriorityStarCount(task.priority),
      hoverPriorityLevel: 0,
      tagColor: task.tag_color || "orange",
    });
  }

  async function handleSubmitTaskModal(event) {
    event.preventDefault();

    const title = taskModal.title.trim();
    const description = taskModal.description.trim();

    if (!title) {
      return;
    }

    if (!taskModal.tagColor) {
      return;
    }

    try {
      const payload = {
        title,
        description,
        task_date: taskModal.date || getDateFullKey(new Date()),
        priority: PRIORITY_BY_STAR[taskModal.priorityLevel] || "normal",
        tag_color: taskModal.tagColor,
      };

      if (taskModal.editingId) {
        await apiRequest(`/api/tasks/${taskModal.editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/api/tasks", {
          method: "POST",
          body: JSON.stringify({
            ...payload,
            task_type: "today",
            status: "new",
          }),
        });
      }

      closeAddTaskModal();
      await loadKanbanTasks();
    } catch (error) {}
  }

  async function handleDeleteTask(taskId) {
    if (!window.confirm(t("tasks.deleteConfirm"))) return;

    try {
      await apiRequest(`/api/tasks/${taskId}`, { method: "DELETE" });
      setTasks((currentTasks) =>
        currentTasks.filter((task) => String(task.id) !== String(taskId)),
      );
    } catch (error) {}
  }

  async function handleChangeTaskPriority(taskId, level) {
    const task = tasks.find((item) => String(item.id) === String(taskId));

    if (!task) return;

    const currentLevel = getPriorityStarCount(task.priority);
    const nextLevel = currentLevel === level ? 0 : level;
    const nextPriority = PRIORITY_BY_STAR[nextLevel] || "normal";
    const previousTasks = tasks;

    setTasks((currentTasks) =>
      currentTasks.map((item) =>
        String(item.id) === String(taskId)
          ? { ...item, priority: nextPriority }
          : item,
      ),
    );

    try {
      await apiRequest(`/api/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify({
          priority: nextPriority,
        }),
      });
    } catch (error) {
      setTasks(previousTasks);
    }
  }

  async function handleDrop(nextStatus) {
    if (!draggedTaskId) return;

    const taskId = draggedTaskId;
    const previousTasks = tasks;

    setDragOverStatus(null);
    setDraggedTaskId(null);
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        String(task.id) === String(taskId)
          ? { ...task, status: nextStatus }
          : task,
      ),
    );

    try {
      await apiRequest(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch (error) {
      setTasks(previousTasks);
    }
  }

  function toggleColumn(status) {
    const willExpand = !expandedColumns.has(status);

    setExpandedColumns((current) => {
      const next = new Set(current);

      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }

      return next;
    });

    if (willExpand) {
      scrollToColumn(status);
    }
  }

  function renderCardStars(task) {
    const taskId = String(task.id);
    const currentLevel = getPriorityStarCount(task.priority);
    const previewLevel = hoveredPriorityById[taskId] || currentLevel;

    return [1, 2, 3].map((level) => (
      <button
        className="card-star-btn"
        type="button"
        key={level}
        aria-label={t("tasks.selectPriority", { level })}
        onMouseEnter={() =>
          setHoveredPriorityById((current) => ({
            ...current,
            [taskId]: level,
          }))
        }
        onFocus={() =>
          setHoveredPriorityById((current) => ({
            ...current,
            [taskId]: level,
          }))
        }
        onClick={(event) => {
          event.stopPropagation();
          handleChangeTaskPriority(task.id, level);
        }}
        onMouseDown={(event) => event.stopPropagation()}
        draggable={false}
      >
        <i
          className={
            level <= previewLevel ? "fa-solid fa-star" : "fa-regular fa-star"
          }
        />
      </button>
    ));
  }

  return (
    <div className="tasks-content">
      <div className="tasks-top">
        <button
          className="task-page-add-btn"
          type="button"
          aria-label={t("tasks.addTaskLabel")}
          onClick={openAddTaskModal}
        >
          <i className="fa-solid fa-plus" />
        </button>
      </div>

      <div className="kanban-board" ref={boardRef}>
        {STATUS_COLUMNS.map((column) => {
          const isExpanded = expandedColumns.has(column.key);
          const isCollapsed = column.collapsible && !isExpanded;

          return (
            <section
              ref={(element) => {
                columnRefs.current[column.key] = element;
              }}
              className={`kanban-column ${isCollapsed ? "collapsed" : ""} ${
                isExpanded ? "expanded" : ""
              } ${
                dragOverStatus === column.key && !isCollapsed ? "drag-over" : ""
              }`}
              data-status={column.key}
              key={column.key}
              onDragOver={(event) => {
                if (isCollapsed) return;
                event.preventDefault();
                setDragOverStatus(column.key);
              }}
              onDragLeave={() => setDragOverStatus(null)}
              onDrop={(event) => {
                event.preventDefault();
                if (!isCollapsed) {
                  handleDrop(column.key);
                }
              }}
            >
              {column.collapsible ? (
                <button
                  className="collapsed-title"
                  type="button"
                  onClick={() => toggleColumn(column.key)}
                >
                  <i
                    className={`fa-solid ${
                      isExpanded ? "fa-caret-right" : "fa-caret-left"
                    }`}
                  />
                  <span>{t(column.labelKey)}</span>
                </button>
              ) : (
                <h2>{t(column.labelKey)}</h2>
              )}

              <div className="kanban-list">
                {(tasksByStatus[column.key] || []).map((task) => {
                  const taskId = String(task.id);
                  const tagColor = task.tag_color;

                  return (
                    <article
                      className={`kanban-card ${
                        String(draggedTaskId) === taskId ? "dragging" : ""
                      }`}
                      draggable
                      data-task-id={task.id}
                      key={task.id}
                      onClick={() => {
                        if (cardDragBlockedRef.current) return;
                        openEditTaskModal(task);
                      }}
                      onDragStart={() => {
                        cardDragBlockedRef.current = true;
                        setDraggedTaskId(task.id);
                      }}
                      onDragEnd={() => {
                        setDraggedTaskId(null);
                        setDragOverStatus(null);
                        window.setTimeout(() => {
                          cardDragBlockedRef.current = false;
                        }, 0);
                      }}
                    >
                      <button
                        className="card-delete-btn"
                        type="button"
                        aria-label={t("tasks.deleteTaskLabel")}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteTask(task.id);
                        }}
                        onMouseDown={(event) => event.stopPropagation()}
                      >
                        x
                      </button>

                      <h3>{task.title}</h3>

                      {tagColor ? (
                        <div className="card-priority">
                          <span className={`priority-line ${tagColor}`} />
                        </div>
                      ) : null}

                      <span className="card-date">
                        {formatTaskDate(
                          task.task_date || task.created_at,
                          i18n.resolvedLanguage || i18n.language,
                          t("tasks.noDate"),
                        )}
                      </span>

                      <div
                        className="card-stars"
                        aria-label={t("tasks.priorityLabel")}
                        onMouseLeave={() =>
                          setHoveredPriorityById((current) => ({
                            ...current,
                            [taskId]: 0,
                          }))
                        }
                      >
                        {renderCardStars(task)}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <AddTaskModal
        modal={taskModal}
        onChange={(patch) =>
          setTaskModal((current) => ({
            ...current,
            ...patch,
          }))
        }
        onClose={closeAddTaskModal}
        onSubmit={handleSubmitTaskModal}
      />
    </div>
  );
}
