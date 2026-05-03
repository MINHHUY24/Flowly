import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { apiRequest } from "../api/apiClient";

const eventColors = ["blue", "pink", "orange", "gray"];

function getStartOfWeek(date) {
  const value = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = value.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  value.setDate(value.getDate() + diff);
  return value;
}

function addDays(date, days) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function addMonths(date, months) {
  const value = new Date(date);
  value.setMonth(value.getMonth() + months);
  return value;
}

function addYears(date, years) {
  const value = new Date(date);
  value.setFullYear(value.getFullYear() + years);
  return value;
}

function buildRepeatDates(startDate, repeatType, repeatCount) {
  const count = Math.max(1, Number(repeatCount) || 1);

  return Array.from({ length: count }, (_, index) => {
    if (repeatType === "weekly") {
      return addDays(startDate, index * 7);
    }

    if (repeatType === "monthly") {
      return addMonths(startDate, index);
    }

    if (repeatType === "yearly") {
      return addYears(startDate, index);
    }

    return startDate;
  });
}

function getDateKeyLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateVN(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

function formatMonthYear(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${month}/${year}`;
}

function parseVNDate(value) {
  const text = String(value || "").trim();
  const vnMatch = text.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);

  if (vnMatch) {
    return new Date(
      Number(vnMatch[3]),
      Number(vnMatch[2]) - 1,
      Number(vnMatch[1]),
    );
  }

  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  if (isoMatch) {
    return new Date(
      Number(isoMatch[1]),
      Number(isoMatch[2]) - 1,
      Number(isoMatch[3]),
    );
  }

  return null;
}

function isSameDateLocal(dateA, dateB) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function isIncompleteSchedule(schedule) {
  return !["done", "completed", "cancelled", "canceled"].includes(
    schedule.status || "pending",
  );
}

function timeStringToMinutes(value) {
  const text = String(value || "09:00").trim();
  const parts = text.split(":");
  const hour = Number(parts[0] || 9);
  const minute = Number(parts[1] || 0);

  return hour * 60 + minute;
}

function hour24ToMinutes(hourValue) {
  const hour = Number(hourValue);

  if (Number.isNaN(hour) || hour < 0 || hour > 24) {
    return null;
  }

  return hour * 60;
}

function minutesToSqlTime(minutes) {
  const safeMinutes = Math.max(0, Math.min(minutes, 24 * 60));
  const hour = Math.floor(safeMinutes / 60);
  const minute = safeMinutes % 60;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
}

function formatScheduleTime(schedule) {
  const startHour = Math.floor(timeStringToMinutes(schedule.start_time) / 60);
  const endHour = Math.floor(timeStringToMinutes(schedule.end_time) / 60);

  return `${startHour}:00 - ${endHour}:00`;
}

function minutesToGridRow(minutes) {
  const hour = Math.floor(minutes / 60);

  if (hour === 0) {
    return 24;
  }

  return Math.max(1, Math.min(hour, 24));
}

function emptyModalState(date) {
  return {
    open: false,
    editingId: null,
    title: "",
    date: formatDateVN(date),
    startHour: "9",
    endHour: "10",
    description: "",
    repeatType: "none",
    repeatCount: "4",
  };
}

function ScheduleModal({ modal, onChange, onClose, onDelete, onSubmit }) {
  const { t } = useTranslation();

  return (
    <div
      className={`schedule-modal-overlay ${modal.open ? "show" : ""}`}
      onClick={onClose}
    >
      <div
        className="schedule-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="schedule-modal-title">
          {modal.editingId ? t("schedule.editTask") : t("schedule.addTask")}
        </h2>

        <form className="schedule-modal-form" onSubmit={onSubmit}>
          <label className="schedule-input-group">
            <i className="fa-regular fa-clipboard" />
            <input
              className="schedule-task-title"
              type="text"
              placeholder={t("schedule.taskName")}
              value={modal.title}
              onChange={(event) => onChange({ title: event.target.value })}
            />
          </label>

          <label className="schedule-input-group">
            <i className="fa-regular fa-calendar-days" />
            <input
              className="schedule-task-date"
              type="text"
              placeholder="01-05-2026"
              value={modal.date}
              onChange={(event) => onChange({ date: event.target.value })}
            />
          </label>

          <div className="schedule-time-row">
            <label className="schedule-time-group">
              <input
                className="schedule-start-hour"
                type="number"
                min="0"
                max="24"
                placeholder="9"
                value={modal.startHour}
                onChange={(event) =>
                  onChange({ startHour: event.target.value })
                }
              />

              <span className="schedule-hour-label">{t("schedule.hour")}</span>
            </label>

            <span className="schedule-time-separator">-</span>

            <label className="schedule-time-group">
              <input
                className="schedule-end-hour"
                type="number"
                min="0"
                max="24"
                placeholder="10"
                value={modal.endHour}
                onChange={(event) => onChange({ endHour: event.target.value })}
              />

              <span className="schedule-hour-label">{t("schedule.hour")}</span>
            </label>
          </div>

          <label className="schedule-input-group">
            <i className="fa-regular fa-message" />
            <input
              className="schedule-task-desc"
              type="text"
              placeholder={t("schedule.description")}
              value={modal.description}
              onChange={(event) =>
                onChange({ description: event.target.value })
              }
            />
          </label>

          <div className="schedule-repeat-row">
            <label className="schedule-repeat-group">
              <i className="fa-solid fa-repeat" />

              <select
                className="schedule-repeat-select"
                value={modal.repeatType}
                onChange={(event) =>
                  onChange({ repeatType: event.target.value })
                }
              >
                <option value="none">{t("schedule.noRepeat")}</option>
                <option value="weekly">{t("schedule.repeatWeekly")}</option>
                <option value="monthly">{t("schedule.repeatMonthly")}</option>
                <option value="yearly">{t("schedule.repeatYearly")}</option>
              </select>
            </label>

            {modal.repeatType !== "none" ? (
              <label className="schedule-repeat-count">
                <span>{t("schedule.repeatCount")}</span>
                <input
                  type="number"
                  min="1"
                  max="52"
                  value={modal.repeatCount}
                  onChange={(event) =>
                    onChange({ repeatCount: event.target.value })
                  }
                />
              </label>
            ) : null}
          </div>

          <div className="schedule-modal-actions">
            <button
              className="schedule-modal-cancel"
              type="button"
              onClick={onClose}
            >
              {t("common.cancel")}
            </button>

            <button
              className={`schedule-modal-delete ${modal.editingId ? "show" : ""}`}
              type="button"
              onClick={onDelete}
            >
              <i className="fa-regular fa-trash-can" />
            </button>

            <button className="schedule-modal-submit" type="submit">
              {modal.editingId ? t("common.save") : t("common.add")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const { t } = useTranslation();
  const [selectedScheduleDate, setSelectedScheduleDate] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    getStartOfWeek(new Date()),
  );
  const [schedules, setSchedules] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [modal, setModal] = useState(() => emptyModalState(new Date()));

  const weekDates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => addDays(currentWeekStart, index)),
    [currentWeekStart],
  );

  const weekKeys = useMemo(() => weekDates.map(getDateKeyLocal), [weekDates]);

  const isCurrentWeek =
    getDateKeyLocal(currentWeekStart) ===
    getDateKeyLocal(getStartOfWeek(new Date()));

  const todayButtonLabel = isCurrentWeek
    ? t("common.today")
    : formatMonthYear(selectedScheduleDate);
  const monthLabels = t("calendar.months", { returnObjects: true });
  const dayLabels = t("calendar.weekdaysShort", { returnObjects: true });

  const weekSchedules = useMemo(() => {
    return schedules
      .filter(
        (schedule) =>
          schedule.schedule_date &&
          weekKeys.includes(schedule.schedule_date) &&
          isIncompleteSchedule(schedule),
      )
      .sort(
        (a, b) =>
          timeStringToMinutes(a.start_time) - timeStringToMinutes(b.start_time),
      );
  }, [schedules, weekKeys]);

  const loadScheduleTasks = useCallback(async () => {
    try {
      const result = await apiRequest("/api/schedules");
      setSchedules(result.schedules || []);
    } catch (error) {
      console.log("Schedule data error:", error);
      alert(t("schedule.loadError") + error.message);
      setSchedules([]);
    }
  }, []);

  useEffect(() => {
    loadScheduleTasks();
  }, [loadScheduleTasks]);

  useEffect(() => {
    function handleChatbotCreated(event) {
      const detail = event.detail || {};

      if (detail.type !== "schedule") return;

      const firstDateKey = (detail.items || []).find(
        (item) => item.schedule_date,
      )?.schedule_date;
      const nextDate = parseVNDate(firstDateKey);

      if (nextDate) {
        selectDate(nextDate);
      }

      loadScheduleTasks();
    }

    window.addEventListener("flowly-chatbot-created", handleChatbotCreated);

    return () => {
      window.removeEventListener(
        "flowly-chatbot-created",
        handleChatbotCreated,
      );
    };
  }, [loadScheduleTasks]);

  function selectDate(date) {
    const nextDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );

    setSelectedScheduleDate(nextDate);
    setCurrentWeekStart(getStartOfWeek(nextDate));
  }

  function openScheduleModal(schedule = null) {
    if (schedule) {
      const scheduleDate =
        parseVNDate(schedule.schedule_date) || selectedScheduleDate;

      setModal({
        open: true,
        editingId: schedule.id,
        title: schedule.title || "",
        date: formatDateVN(scheduleDate),
        startHour: String(
          Math.floor(timeStringToMinutes(schedule.start_time) / 60),
        ),
        endHour: String(
          Math.floor(timeStringToMinutes(schedule.end_time) / 60),
        ),
        description: schedule.description || "",
        repeatType: "none",
        repeatCount: "2",
      });
      return;
    }

    setModal({
      ...emptyModalState(selectedScheduleDate),
      open: true,
    });
  }

  function closeScheduleModal() {
    setModal((current) => ({
      ...current,
      open: false,
      editingId: null,
    }));
  }

  async function handleSubmitSchedule(event) {
    event.preventDefault();

    const title = modal.title.trim();
    const parsedDate = parseVNDate(modal.date);
    const description = modal.description.trim();

    if (!title) {
      alert(t("schedule.enterTaskName"));
      return;
    }

    if (!parsedDate) {
      alert(t("schedule.invalidDate"));
      return;
    }

    const startMinutes = hour24ToMinutes(modal.startHour);
    const endMinutes = hour24ToMinutes(modal.endHour);

    if (startMinutes === null || endMinutes === null) {
      alert(t("schedule.invalidHour"));
      return;
    }

    if (endMinutes <= startMinutes) {
      alert(t("schedule.invalidEndHour"));
      return;
    }

    const payload = {
      title,
      description,
      schedule_date: getDateKeyLocal(parsedDate),
      start_time: minutesToSqlTime(startMinutes),
      end_time: minutesToSqlTime(endMinutes),
      status: "pending",
    };

    try {
      if (modal.editingId) {
        await apiRequest(`/api/schedules/${modal.editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        if (modal.repeatType !== "none") {
          const repeatDates = buildRepeatDates(
            parsedDate,
            modal.repeatType,
            modal.repeatCount,
          ).slice(1);

          await Promise.all(
            repeatDates.map((date, index) =>
              apiRequest("/api/schedules", {
                method: "POST",
                body: JSON.stringify({
                  ...payload,
                  schedule_date: getDateKeyLocal(date),
                  color: eventColors[index % eventColors.length],
                }),
              }),
            ),
          );
        }
      } else {
        const repeatDates = buildRepeatDates(
          parsedDate,
          modal.repeatType,
          modal.repeatType === "none" ? 1 : modal.repeatCount,
        );

        await Promise.all(
          repeatDates.map((date, index) =>
            apiRequest("/api/schedules", {
              method: "POST",
              body: JSON.stringify({
                ...payload,
                schedule_date: getDateKeyLocal(date),
                color: eventColors[index % eventColors.length],
              }),
            }),
          ),
        );
      }

      setSelectedScheduleDate(parsedDate);
      setCurrentWeekStart(getStartOfWeek(parsedDate));
      closeScheduleModal();
      await loadScheduleTasks();
    } catch (error) {
      alert(
        modal.editingId
          ? t("schedule.saveError") + error.message
          : t("schedule.addError") + error.message,
      );
    }
  }

  async function deleteEditingSchedule() {
    if (!modal.editingId) return;

    const deletedId = modal.editingId;

    try {
      await apiRequest(`/api/schedules/${deletedId}`, {
        method: "DELETE",
      });

      setSchedules((currentSchedules) =>
        currentSchedules.filter(
          (schedule) => String(schedule.id) !== String(deletedId),
        ),
      );

      closeScheduleModal();
      await loadScheduleTasks();
    } catch (error) {
      alert(t("schedule.deleteError") + error.message);
    }
  }

  return (
    <div className="schedule-content">
      <div className="schedule-toolbar">
        <div />

        <div className="schedule-actions">
          <button
            className="schedule-nav-btn prev-week-btn"
            type="button"
            aria-label={t("schedule.previousWeek")}
            onClick={() => selectDate(addDays(selectedScheduleDate, -7))}
          >
            <i className="fa-solid fa-chevron-left" />
          </button>

          <button
            className="today-btn"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setPickerYear(selectedScheduleDate.getFullYear());
              setPickerOpen((current) => !current);
            }}
          >
            {todayButtonLabel}
          </button>

          <button
            className="schedule-nav-btn next-week-btn"
            type="button"
            aria-label={t("schedule.nextWeek")}
            onClick={() => selectDate(addDays(selectedScheduleDate, 7))}
          >
            <i className="fa-solid fa-chevron-right" />
          </button>

          <div
            className={`today-dropdown month-picker-dropdown ${
              pickerOpen ? "show" : ""
            }`}
          >
            <div className="month-picker-header">
              <button
                className="month-picker-nav prev-year-picker"
                type="button"
                onClick={() => setPickerYear(pickerYear - 1)}
              >
                <i className="fa-solid fa-chevron-left" />
              </button>

              <h3>{pickerYear}</h3>

              <button
                className="month-picker-nav next-year-picker"
                type="button"
                onClick={() => setPickerYear(pickerYear + 1)}
              >
                <i className="fa-solid fa-chevron-right" />
              </button>
            </div>

            <div className="month-picker-grid">
              {monthLabels.map((label, index) => {
                const isSelected =
                  index === selectedScheduleDate.getMonth() &&
                  pickerYear === selectedScheduleDate.getFullYear();
                const isCurrent =
                  index === new Date().getMonth() &&
                  pickerYear === new Date().getFullYear();

                return (
                  <button
                    className={`month-picker-item ${isSelected ? "active" : ""} ${
                      isCurrent ? "current" : ""
                    }`}
                    type="button"
                    data-month={index}
                    key={label}
                    onClick={() => {
                      const nextDate = new Date(pickerYear, index, 1);
                      setPickerOpen(false);
                      selectDate(nextDate);
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          className="schedule-add-btn"
          type="button"
          aria-label={t("schedule.addScheduleLabel")}
          onClick={() => openScheduleModal()}
        >
          <i className="fa-solid fa-plus" />
        </button>
      </div>

      <div className="schedule-card">
        <div className="schedule-days">
          {weekDates.map((date, index) => (
            <button
              type="button"
              className={`day-item ${
                isSameDateLocal(date, selectedScheduleDate) ? "active" : ""
              } ${isSameDateLocal(date, new Date()) ? "today" : ""} ${
                index >= 5 ? "muted" : ""
              }`}
              data-date={getDateKeyLocal(date)}
              key={getDateKeyLocal(date)}
              onClick={() => selectDate(date)}
            >
              <span>{dayLabels[index]}</span>
              <strong>{date.getDate()}</strong>
            </button>
          ))}
        </div>

        <div className="schedule-board">
          <div className="schedule-timeline">
            <div className="time-column">
              {[
                "1 AM",
                "2 AM",
                "3 AM",
                "4 AM",
                "5 AM",
                "6 AM",
                "7 AM",
                "8 AM",
                "9 AM",
                "10 AM",
                "11 AM",
                "12 PM",
                "13 PM",
                "14 PM",
                "15 PM",
                "16 PM",
                "17 PM",
                "18 PM",
                "19 PM",
                "20 PM",
                "21 PM",
                "22 PM",
                "23 PM",
                "0 AM",
              ].map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <div className="schedule-grid">
              {weekSchedules.map((schedule, index) => {
                const dayIndex = weekKeys.indexOf(schedule.schedule_date);
                const startMinutes = timeStringToMinutes(schedule.start_time);
                const endMinutes = timeStringToMinutes(schedule.end_time);
                const durationMinutes = Math.max(60, endMinutes - startMinutes);
                const startRow = minutesToGridRow(startMinutes);
                const endRow = Math.max(
                  startRow + 1,
                  minutesToGridRow(endMinutes),
                );

                return (
                  <div
                    className={`event-card ${
                      schedule.color || eventColors[index % eventColors.length]
                    } ${durationMinutes <= 60 ? "short-event" : ""}`}
                    data-schedule-id={schedule.id}
                    key={schedule.id}
                    style={{
                      gridColumn: `${dayIndex + 1} / ${dayIndex + 2}`,
                      gridRow: `${startRow} / ${endRow}`,
                      width: "88%",
                      justifySelf: "center",
                      transform: "none",
                      zIndex: String(1000 + startMinutes),
                    }}
                    onClick={() => openScheduleModal(schedule)}
                  >
                    <h4>{schedule.title}</h4>
                    <p>{formatScheduleTime(schedule)}</p>
                    {schedule.description ? (
                      <small>{schedule.description}</small>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <ScheduleModal
        modal={modal}
        onChange={(patch) => setModal((current) => ({ ...current, ...patch }))}
        onClose={closeScheduleModal}
        onDelete={deleteEditingSchedule}
        onSubmit={handleSubmitSchedule}
      />
    </div>
  );
}
