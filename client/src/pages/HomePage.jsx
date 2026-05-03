import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { apiRequest } from "../api/apiClient";
import TaskActionToolbar from "../components/TaskActionToolbar";
import TaskSearch from "../components/TaskSearch";
import { getDateFullKey, getDateMonthDayKey, isSameDate } from "../utils/date";

function isIncompleteTask(task) {
  return !["done", "completed", "cancelled", "canceled"].includes(
    task.status || "pending",
  );
}

function isCompletedTask(task) {
  return ["done", "completed"].includes(task.status || "");
}

function isCancelledTask(task) {
  return ["cancelled", "canceled"].includes(task.status || "");
}

function isKanbanTask(task) {
  return ["new", "doing", "paused"].includes(task.status || "");
}

function isUrgentTask(task) {
  return ["urgent", "high", "khẩn cấp", "khan cap"].includes(
    task.priority || "normal",
  );
}

function formatDateLabel(date, language) {
  return date.toLocaleDateString(language === "en" ? "en-US" : "vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getTaskDateKey(task) {
  if (task.task_date) {
    return String(task.task_date).slice(0, 10);
  }

  if (!task.created_at) return "";

  const createdAt = new Date(task.created_at);

  if (Number.isNaN(createdAt.getTime())) return "";

  return getDateFullKey(createdAt);
}

function parseDateKeyLocal(value) {
  const [year, month, day] = String(value || "")
    .slice(0, 10)
    .split("-")
    .map(Number);

  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function buildCalendarCells(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const cells = [];
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDaysInMonth = lastDayOfMonth.getDate();

  let startDay = firstDayOfMonth.getDay();
  startDay = startDay === 0 ? 6 : startDay - 1;

  const previousMonthLastDay = new Date(year, month, 0).getDate();

  for (let index = startDay - 1; index >= 0; index -= 1) {
    const dayNumber = previousMonthLastDay - index;
    cells.push({
      date: new Date(year, month - 1, dayNumber),
      dayNumber,
      muted: true,
    });
  }

  for (let day = 1; day <= totalDaysInMonth; day += 1) {
    cells.push({
      date: new Date(year, month, day),
      dayNumber: day,
      muted: false,
    });
  }

  const totalCells = cells.length <= 35 ? 35 : 42;
  const nextMonthDays = totalCells - cells.length;

  for (let day = 1; day <= nextMonthDays; day += 1) {
    cells.push({
      date: new Date(year, month + 1, day),
      dayNumber: day,
      muted: true,
    });
  }

  return cells;
}

function EditableText({ as: Tag, editing, value, onChange, ...props }) {
  if (!editing) {
    return <Tag {...props}>{value}</Tag>;
  }

  return (
    <Tag
      {...props}
      contentEditable
      suppressContentEditableWarning
      onInput={(event) => onChange(event.currentTarget.textContent)}
    >
      {value}
    </Tag>
  );
}

function TaskModal({
  open,
  type,
  title,
  description,
  dateLabel,
  isTodayDate,
  onChange,
  onClose,
  onSubmit,
}) {
  const { t } = useTranslation();

  const modalTitle =
    type === "today"
      ? isTodayDate
        ? t("home.addTodayTask")
        : t("home.addDateTask", { date: dateLabel })
      : t("home.addSchedule", { date: dateLabel });

  return (
    <div
      className={`task-modal-overlay ${open ? "show" : ""}`}
      onClick={onClose}
    >
      <div className="task-modal" onClick={(event) => event.stopPropagation()}>
        <h2 className="task-modal-title">{modalTitle}</h2>

        <form className="task-modal-form" onSubmit={onSubmit}>
          <div className="task-modal-input-group">
            <i className="fa-regular fa-clipboard" />
            <input
              type="text"
              className="task-modal-name"
              placeholder={t("home.taskName")}
              value={title}
              onChange={(event) => onChange({ title: event.target.value })}
            />
          </div>

          <div className="task-modal-input-group">
            <i className="fa-regular fa-message" />
            <input
              type="text"
              className="task-modal-desc"
              placeholder={t("home.description")}
              value={description}
              onChange={(event) =>
                onChange({ description: event.target.value })
              }
            />
          </div>

          <div className="task-modal-actions">
            <button
              type="button"
              className="task-modal-cancel"
              onClick={onClose}
            >
              {t("common.cancel")}
            </button>
            <button type="submit" className="task-modal-submit">
              {t("common.add")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [holidaysByYear, setHolidaysByYear] = useState({});
  const [tooltip, setTooltip] = useState({ show: false, text: "", x: 0, y: 0 });
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
  const [activeTaskArea, setActiveTaskArea] = useState(null);
  const [pendingPriorityById, setPendingPriorityById] = useState({});
  const [editingTaskIds, setEditingTaskIds] = useState(new Set());
  const [draftsById, setDraftsById] = useState({});
  const [modal, setModal] = useState({
    open: false,
    type: "today",
    dateKey: getDateFullKey(new Date()),
    title: "",
    description: "",
  });

  const todayKey = getDateFullKey(new Date());
  const selectedKey = getDateFullKey(selectedDate);
  const currentLanguage = i18n.resolvedLanguage || i18n.language || "vi";
  const monthNames = t("calendar.months", { returnObjects: true });
  const selectedDateLabel = formatDateLabel(selectedDate, currentLanguage);
  const isSelectedToday = selectedKey === todayKey;
  const modalDateLabel = modal.dateKey
    ? formatDateLabel(new Date(`${modal.dateKey}T00:00:00`), currentLanguage)
    : selectedDateLabel;

  const incompleteTasks = useMemo(
    () => tasks.filter((task) => isIncompleteTask(task) && !isKanbanTask(task)),
    [tasks],
  );

  const incompleteDailyTasks = useMemo(
    () => incompleteTasks.filter((task) => task.task_type === "today"),
    [incompleteTasks],
  );

  const todayTasks = useMemo(
    () =>
      incompleteDailyTasks.filter((task) => getTaskDateKey(task) === todayKey),
    [incompleteDailyTasks, todayKey],
  );

  const selectedDateTasks = useMemo(() => {
    return incompleteDailyTasks.filter(
      (task) => getTaskDateKey(task) === selectedKey,
    );
  }, [incompleteDailyTasks, selectedKey]);
  const incompleteDailyTasksByDate = useMemo(
    () =>
      incompleteDailyTasks.reduce((map, task) => {
        const taskDateKey = getTaskDateKey(task);

        if (!taskDateKey) return map;

        map[taskDateKey] = map[taskDateKey] || [];
        map[taskDateKey].push(task);
        return map;
      }, {}),
    [incompleteDailyTasks],
  );

  const filteredSelectedDateTasks = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword) return selectedDateTasks;

    return selectedDateTasks.filter((task) =>
      String(task.title || "")
        .toLowerCase()
        .includes(keyword),
    );
  }, [searchKeyword, selectedDateTasks]);

  const selectedDateTaskCount = selectedDateTasks.length;

  const selectedSummaryLabel = isSelectedToday
    ? t("common.today")
    : selectedDateLabel;

  const taskSearchPlaceholder = isSelectedToday
    ? t("home.searchToday")
    : t("home.searchDate");

  const emptyDailyTaskMessage = isSelectedToday
    ? t("home.emptyToday")
    : t("home.emptyDate");

  const taskDateTitle = isSelectedToday
    ? t("home.todayTasks")
    : t("home.dateTasks", { date: selectedDateLabel });

  const taskDateCountText = isSelectedToday
    ? t("home.incompleteCount", { count: selectedDateTaskCount })
    : t("home.taskCount", { count: selectedDateTaskCount });

  const filteredTodayTasks = filteredSelectedDateTasks;

  const futureTasks = useMemo(
    () => incompleteTasks.filter((task) => task.task_type === "future"),
    [incompleteTasks],
  );

  const remindersForSelectedDate = useMemo(
    () => futureTasks.filter((task) => getTaskDateKey(task) === selectedKey),
    [futureTasks, selectedKey],
  );

  const remindersByDate = useMemo(() => {
    return futureTasks.reduce((map, task) => {
      const taskDateKey = getTaskDateKey(task);

      if (!taskDateKey) return map;

      map[taskDateKey] = map[taskDateKey] || [];
      map[taskDateKey].push(task);
      return map;
    }, {});
  }, [futureTasks]);

  const summary = useMemo(() => {
    return {
      today: todayTasks.length,
      future: futureTasks.length,
      urgent: incompleteTasks.filter((task) => isUrgentTask(task)).length,
    };
  }, [futureTasks, incompleteTasks, todayTasks]);

  const selectedIds = useMemo(
    () => Array.from(selectedTaskIds).map(String),
    [selectedTaskIds],
  );

  const selectedHasPriority = selectedIds.some((taskId) => {
    const task = tasks.find((item) => String(item.id) === taskId);
    const priority = pendingPriorityById[taskId] || task?.priority || "normal";

    return isUrgentTask({ priority });
  });

  const visibleTodayIds = filteredTodayTasks.map((task) => String(task.id));
  const visibleReminderIds = remindersForSelectedDate.map((task) =>
    String(task.id),
  );

  const loadUserTasks = useCallback(async () => {
    try {
      const result = await apiRequest("/api/tasks");

      setTasks(result.tasks || []);
      setSelectedTaskIds(new Set());
      setActiveTaskArea(null);
      setPendingPriorityById({});
      setEditingTaskIds(new Set());
      setDraftsById({});
    } catch (error) {
      console.log("Load tasks error:", error);
    }
  }, []);

  useEffect(() => {
    loadUserTasks();
  }, [loadUserTasks]);

  useEffect(() => {
    function handleChatbotCreated(event) {
      const detail = event.detail || {};

      if (detail.type !== "tasks") return;

      const firstDateKey = (detail.items || []).find(
        (item) => item.task_date,
      )?.task_date;
      const nextDate = parseDateKeyLocal(firstDateKey);

      if (nextDate) {
        setCalendarDate(nextDate);
        setPickerYear(nextDate.getFullYear());
        setPickerOpen(false);
        selectDate(nextDate);
      }

      loadUserTasks();
    }

    window.addEventListener("flowly-chatbot-created", handleChatbotCreated);

    return () => {
      window.removeEventListener(
        "flowly-chatbot-created",
        handleChatbotCreated,
      );
    };
  }, [loadUserTasks]);

  useEffect(() => {
    const year = calendarDate.getFullYear();

    if (holidaysByYear[year]) return;

    async function loadHolidays() {
      try {
        const response = await fetch(`/api/holidays/${year}`);

        if (!response.ok) {
          throw new Error(t("home.loadHolidayError"));
        }

        const holidays = await response.json();

        setHolidaysByYear((current) => ({
          ...current,
          [year]: holidays,
        }));
      } catch (error) {
        console.log("Holiday error:", error);
        setHolidaysByYear((current) => ({
          ...current,
          [year]: {},
        }));
      }
    }

    loadHolidays();
  }, [calendarDate, holidaysByYear]);

  function clearTaskSelection() {
    setSelectedTaskIds(new Set());
    setActiveTaskArea(null);
    setPendingPriorityById({});
    setEditingTaskIds(new Set());
    setDraftsById({});
  }

  function resetAreaIfNeeded(area) {
    if (activeTaskArea && activeTaskArea !== area) {
      clearTaskSelection();
    }
  }

  function toggleTaskSelection(taskId, area) {
    const id = String(taskId);

    resetAreaIfNeeded(area);
    setActiveTaskArea(area);
    setSelectedTaskIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      if (next.size === 0) {
        setActiveTaskArea(null);
        setPendingPriorityById({});
        setEditingTaskIds(new Set());
        setDraftsById({});
      }

      return next;
    });
  }

  function selectAllVisibleTasks(area) {
    const ids = area === "today" ? visibleTodayIds : visibleReminderIds;

    if (ids.length === 0) return;

    resetAreaIfNeeded(area);
    setActiveTaskArea(area);
    setSelectedTaskIds((current) => {
      const next = new Set(current);
      const isAllSelected = ids.every((taskId) => next.has(taskId));

      if (isAllSelected) {
        ids.forEach((taskId) => next.delete(taskId));
      } else {
        ids.forEach((taskId) => next.add(taskId));
      }

      if (next.size === 0) {
        setActiveTaskArea(null);
        setPendingPriorityById({});
      }

      return next;
    });
  }

  function markSelectedTasksPriority() {
    if (selectedTaskIds.size === 0) return;

    setPendingPriorityById((current) => {
      const next = { ...current };

      selectedIds.forEach((taskId) => {
        const task = tasks.find((item) => String(item.id) === taskId);
        const priority = next[taskId] || task?.priority || "normal";

        next[taskId] = isUrgentTask({ priority }) ? "normal" : "high";
      });

      return next;
    });
  }

  async function completeSelectedTasks() {
    if (selectedTaskIds.size === 0) return;

    try {
      await Promise.all(
        selectedIds.map((taskId) =>
          apiRequest(`/api/tasks/${taskId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status: "done" }),
          }),
        ),
      );

      await loadUserTasks();
    } catch (error) {}
  }

  function enableTaskEdit(taskId, area) {
    const id = String(taskId);
    const task = tasks.find((item) => String(item.id) === id);

    if (!task) return;

    resetAreaIfNeeded(area);
    setActiveTaskArea(area);
    setSelectedTaskIds((current) => new Set(current).add(id));
    setEditingTaskIds((current) => new Set(current).add(id));
    setDraftsById((current) => ({
      ...current,
      [id]: {
        title: task.title || "",
        description: task.description || "",
      },
    }));
  }

  function updateDraft(taskId, field, value) {
    const id = String(taskId);

    setDraftsById((current) => ({
      ...current,
      [id]: {
        title: current[id]?.title ?? "",
        description: current[id]?.description ?? "",
        [field]: value,
      },
    }));
  }

  async function saveSelectedTaskEdits() {
    if (selectedTaskIds.size === 0) return;

    try {
      await Promise.all(
        selectedIds.map((taskId) => {
          const task = tasks.find((item) => String(item.id) === taskId);

          if (!task) return Promise.resolve();

          const draft = draftsById[taskId] || {};
          const title = (draft.title ?? task.title ?? "").trim();
          const description = (
            draft.description ??
            task.description ??
            ""
          ).trim();

          if (!title) {
            throw new Error(t("home.taskNameRequired"));
          }

          const body = { title, description };

          if (pendingPriorityById[taskId]) {
            body.priority = pendingPriorityById[taskId];
          }

          return apiRequest(`/api/tasks/${taskId}`, {
            method: "PUT",
            body: JSON.stringify(body),
          });
        }),
      );

      await loadUserTasks();
    } catch (error) {}
  }

  async function deleteTask(taskId) {
    const id = String(taskId);

    if (!window.confirm(t("home.deleteConfirm"))) return;

    try {
      await apiRequest(`/api/tasks/${id}`, { method: "DELETE" });
      await loadUserTasks();
    } catch (error) {}
  }

  function selectDate(date) {
    setSelectedDate(date);
    setSearchKeyword("");
    clearTaskSelection();
  }

  function jumpToToday() {
    const today = new Date();

    setCalendarDate(today);
    setPickerYear(today.getFullYear());
    setPickerOpen(false);
    selectDate(today);
  }

  function openAddTaskModal(type, dateKey = selectedKey) {
    setModal({
      open: true,
      type,
      dateKey,
      title: "",
      description: "",
    });
  }

  async function handleAddTask(event) {
    event.preventDefault();

    const title = modal.title.trim();
    const description = modal.description.trim();

    if (!title) {
      return;
    }

    try {
      await apiRequest("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          task_type: modal.type,
          task_date: modal.dateKey || selectedKey,
          status: "pending",
          priority: "normal",
        }),
      });

      setModal((current) => ({ ...current, open: false }));
      await loadUserTasks();
    } catch (error) {}
  }

  function handlePrevMonth() {
    const nextDate = new Date(calendarDate);
    nextDate.setMonth(nextDate.getMonth() - 1);
    setCalendarDate(nextDate);
    setPickerYear(nextDate.getFullYear());
  }

  function handleNextMonth() {
    const nextDate = new Date(calendarDate);
    nextDate.setMonth(nextDate.getMonth() + 1);
    setCalendarDate(nextDate);
    setPickerYear(nextDate.getFullYear());
  }

  function handleMonthPick(monthIndex) {
    const nextDate = new Date(pickerYear, monthIndex, 1);
    setCalendarDate(nextDate);
    setPickerOpen(false);
  }

  function getTaskPriority(task) {
    return pendingPriorityById[String(task.id)] || task.priority || "normal";
  }

  function renderTaskItem(task, area) {
    const id = String(task.id);
    const isSelected = selectedTaskIds.has(id);
    const isEditing = editingTaskIds.has(id);
    const draft = draftsById[id] || {};
    const title = draft.title ?? task.title ?? "";
    const description =
      draft.description ??
      task.description ??
      (area === "today"
        ? t("home.noTaskDescription")
        : t("home.noScheduleDescription"));

    return (
      <div
        className={`${area === "today" ? "task-item" : "reminder-item"} ${
          isSelected ? "selected-task" : ""
        } ${isEditing ? "is-editing" : ""} ${
          isUrgentTask({ priority: getTaskPriority(task) })
            ? "priority-task"
            : ""
        } ${isCompletedTask(task) ? "completed-task" : ""} ${
          isCancelledTask(task) ? "cancelled-task" : ""
        }`}
        data-task-id={task.id}
        key={task.id}
      >
        <div className="task-main">
          <span className="priority-dot" />

          <div className={area === "today" ? "task-info" : "reminder-info"}>
            <EditableText
              as="h3"
              data-edit="title"
              editing={isEditing}
              value={title}
              onChange={(value) => updateDraft(id, "title", value)}
            />
            <EditableText
              as="p"
              data-edit="description"
              editing={isEditing}
              value={description}
              onChange={(value) => updateDraft(id, "description", value)}
            />
          </div>
        </div>

        <div className="task-item-actions">
          <button
            className="task-edit-btn"
            type="button"
            title={t("common.edit")}
            onClick={() => enableTaskEdit(id, area)}
          >
            <i className="fa-solid fa-pen" />
          </button>

          <button
            className="task-delete-btn"
            type="button"
            title={t("common.delete")}
            onClick={() => deleteTask(id)}
          >
            <i className="fa-regular fa-trash-can" />
          </button>

          <button
            className={`${area === "today" ? "task-circle" : "reminder-circle"} ${
              isSelected ? "selected" : ""
            }`}
            type="button"
            aria-label={
              area === "today" ? t("home.chooseTask") : t("home.chooseSchedule")
            }
            onClick={() => toggleTaskSelection(id, area)}
          >
            <i className="fa-solid fa-check" />
          </button>
        </div>
      </div>
    );
  }

  const calendarCells = buildCalendarCells(calendarDate);
  const holidays = holidaysByYear[calendarDate.getFullYear()] || {};
  const calendarTitle = `${monthNames[calendarDate.getMonth()]} ${calendarDate.getFullYear()}`;
  const suggestions = selectedDateTasks
    .map((task) => task.title)
    .filter(Boolean)
    .filter((title) =>
      title.toLowerCase().includes(searchKeyword.trim().toLowerCase()),
    );

  return (
    <div className="content">
      <div className="ct-left">
        <div className="ct-left-top">
          <div className="summary-card today-card">
            <div className="summary-top">
              <i className="fa-regular fa-calendar card-icon" />
              <span className="summary-number">{selectedDateTaskCount}</span>
            </div>
            <p>{selectedSummaryLabel}</p>
          </div>

          <div className="summary-card schedule-card-home">
            <div className="summary-top">
              <i className="fa-regular fa-calendar-days card-icon" />
              <span className="summary-number">{summary.future}</span>
            </div>
            <p>{t("home.schedulePlanned")}</p>
          </div>

          <div className="summary-card urgent-card">
            <div className="summary-top">
              <i className="fa-regular fa-clock card-icon" />
              <span className="summary-number">{summary.urgent}</span>
            </div>
            <p>{t("home.urgent")}</p>
          </div>
        </div>

        <div className="ct-left-bottom">
          <TaskSearch
            hidden={selectedTaskIds.size > 0 && activeTaskArea === "today"}
            keyword={searchKeyword}
            placeholder={taskSearchPlaceholder}
            suggestions={suggestions}
            showSuggestions={Boolean(searchKeyword.trim())}
            onKeywordChange={setSearchKeyword}
            onSuggestionSelect={setSearchKeyword}
            onAdd={() => openAddTaskModal("today", selectedKey)}
          >
            <TaskActionToolbar
              className="left-action-toolbar"
              show={selectedTaskIds.size > 0 && activeTaskArea === "today"}
              priorityActive={selectedHasPriority}
              onSelectAll={() => selectAllVisibleTasks("today")}
              onTogglePriority={markSelectedTasksPriority}
              onSave={saveSelectedTaskEdits}
              onComplete={completeSelectedTasks}
              onClose={clearTaskSelection}
            />
          </TaskSearch>

          <div className="task-list">
            {filteredTodayTasks.length === 0 ? (
              <div className="empty-reminder">{emptyDailyTaskMessage}</div>
            ) : (
              filteredTodayTasks.map((task) => renderTaskItem(task, "today"))
            )}
          </div>
        </div>
      </div>

      <div className="ct-right">
        <div className="calendar-card">
          <div className="calendar-header">
            <button
              className="calendar-nav-btn prev-month-btn"
              type="button"
              onClick={handlePrevMonth}
            >
              <i className="fa-solid fa-chevron-left" />
            </button>

            <h2
              className="calendar-title"
              onClick={(event) => {
                event.stopPropagation();
                setPickerYear(calendarDate.getFullYear());
                setPickerOpen((current) => !current);
              }}
            >
              {calendarTitle}
            </h2>

            <button
              className="calendar-nav-btn next-month-btn"
              type="button"
              onClick={handleNextMonth}
            >
              <i className="fa-solid fa-chevron-right" />
            </button>
          </div>

          <div className="calendar-line" />

          <div className="calendar-weekdays">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          <div className="calendar-days">
            {calendarCells.map((cell) => {
              const holidayName = holidays[getDateMonthDayKey(cell.date)] || "";
              const fullDateKey = getDateFullKey(cell.date);
              const hasTask = Boolean(
                incompleteDailyTasksByDate[fullDateKey]?.length ||
                remindersByDate[fullDateKey]?.length,
              );
              const classes = [
                cell.muted ? "muted-day" : "",
                holidayName ? "holiday-day" : "",
                isSameDate(cell.date, new Date()) ? "today-day" : "",
                isSameDate(cell.date, selectedDate) ? "selected-day" : "",
                hasTask ? "has-reminder-day" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <span
                  className={classes}
                  data-holiday-name={holidayName || undefined}
                  key={`${fullDateKey}-${cell.muted ? "muted" : "current"}`}
                  onClick={() =>
                    selectDate(
                      new Date(
                        cell.date.getFullYear(),
                        cell.date.getMonth(),
                        cell.date.getDate(),
                      ),
                    )
                  }
                  onMouseEnter={(event) => {
                    if (!holidayName) return;
                    setTooltip({
                      show: true,
                      text: holidayName,
                      x: event.clientX + 14,
                      y: event.clientY + 14,
                    });
                  }}
                  onMouseMove={(event) => {
                    if (!holidayName) return;
                    setTooltip((current) => ({
                      ...current,
                      x: event.clientX + 14,
                      y: event.clientY + 14,
                    }));
                  }}
                  onMouseLeave={() =>
                    setTooltip((current) => ({ ...current, show: false }))
                  }
                >
                  {cell.dayNumber}
                </span>
              );
            })}
          </div>

          <div className={`calendar-picker ${pickerOpen ? "show" : ""}`}>
            <div className="calendar-picker-header">
              <button
                type="button"
                onClick={() => setPickerYear(pickerYear - 1)}
              >
                <i className="fa-solid fa-chevron-left" />
              </button>

              <span className="picker-year">{pickerYear}</span>

              <button
                type="button"
                onClick={() => setPickerYear(pickerYear + 1)}
              >
                <i className="fa-solid fa-chevron-right" />
              </button>
            </div>

            <div className="month-picker-grid">
              {monthNames.map((monthName, index) => (
                <button
                  className={`month-picker-btn ${
                    index === calendarDate.getMonth() &&
                    pickerYear === calendarDate.getFullYear()
                      ? "active"
                      : ""
                  }`}
                  type="button"
                  key={monthName}
                  onClick={() => handleMonthPick(index)}
                >
                  {monthName}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="reminder-actions">
          <button
            className={`reminder-add-btn ${
              selectedTaskIds.size > 0 && activeTaskArea === "future"
                ? "hide"
                : ""
            }`}
            type="button"
            aria-label={t("home.addScheduleLabel")}
            onClick={() => openAddTaskModal("future", selectedKey)}
          >
            <i className="fa-solid fa-plus" />
          </button>

          <TaskActionToolbar
            className="right-action-toolbar"
            show={selectedTaskIds.size > 0 && activeTaskArea === "future"}
            priorityActive={selectedHasPriority}
            onSelectAll={() => selectAllVisibleTasks("future")}
            onTogglePriority={markSelectedTasksPriority}
            onSave={saveSelectedTaskEdits}
            onComplete={completeSelectedTasks}
            onClose={clearTaskSelection}
          />
        </div>

        <div className="reminder-list">
          {remindersForSelectedDate.length === 0 ? (
            <div className="empty-reminder">{t("home.emptyReminder")}</div>
          ) : (
            remindersForSelectedDate.map((task) =>
              renderTaskItem(task, "future"),
            )
          )}
        </div>
      </div>

      <div
        className={`holiday-tooltip ${tooltip.show ? "show" : ""}`}
        style={{ left: tooltip.x, top: tooltip.y }}
      >
        {tooltip.text}
      </div>

      <TaskModal
        open={modal.open}
        type={modal.type}
        title={modal.title}
        description={modal.description}
        dateLabel={modalDateLabel}
        isTodayDate={modal.dateKey === todayKey}
        onChange={(patch) => setModal((current) => ({ ...current, ...patch }))}
        onClose={() => setModal((current) => ({ ...current, open: false }))}
        onSubmit={handleAddTask}
      />
    </div>
  );
}
