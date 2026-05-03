import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

import { apiRequest } from "../api/apiClient";
import { initSupabaseClient } from "../api/supabaseClient";
import { getCurrentDateText } from "../utils/date";

function getDisplayName(user) {
  return (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User"
  );
}

function getFallbackAvatarUrl(user) {
  const name = getDisplayName(user);
  const email = user?.email || name || "User";

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || email,
  )}&background=eef1fb&color=2157c0&bold=true&size=128`;
}

function getUserAvatarUrl(user) {
  const metadata = user?.user_metadata || {};

  return (
    metadata.avatar_url ||
    metadata.picture ||
    metadata.photoURL ||
    user?.identities?.[0]?.identity_data?.avatar_url ||
    user?.identities?.[0]?.identity_data?.picture ||
    getFallbackAvatarUrl(user)
  );
}

function getUserPhone(user) {
  return user?.user_metadata?.phone || "";
}

function getUserBirthday(user) {
  return user?.user_metadata?.birthday || "";
}

function formatTaskDate(value, language) {
  if (!value) return language === "en" ? "No date" : "Chưa có ngày";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(language === "en" ? "en-US" : "vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function addOneHour(timeValue) {
  if (!timeValue) return "10:00:00";

  const [hourText, minuteText] = timeValue.split(":");
  const date = new Date();

  date.setHours(Number(hourText || 9), Number(minuteText || 0), 0, 0);
  date.setHours(date.getHours() + 1);

  return `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}:00`;
}

function normalizeAiItems(result) {
  if (!result || !Array.isArray(result.items)) {
    return [];
  }

  return result.items.filter((item) => item && item.title);
}

function getPageContextFromPath(pathname) {
  if (pathname.startsWith("/schedule")) return "schedule";
  if (pathname.startsWith("/tasks")) return "tasks";

  return "home";
}

function getDateKeyLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey) {
  const [year, month, day] = String(dateKey || "")
    .split("-")
    .map(Number);

  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) return null;

  return date;
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

function getRecurringDate(startDate, repeatType, index) {
  if (repeatType === "monthly") return addMonths(startDate, index);
  if (repeatType === "yearly") return addYears(startDate, index);

  return addDays(startDate, index * 7);
}

function expandScheduleItem(item) {
  const startDate = parseDateKey(item.schedule_date || item.task_date);

  if (!startDate || !item.repeat_type || item.repeat_type === "none") {
    return [item];
  }

  const repeatUntil = parseDateKey(item.repeat_until);
  const repeatCount = Math.min(Math.max(Number(item.repeat_count) || 0, 0), 104);
  const dates = [];

  if (repeatUntil && repeatUntil >= startDate) {
    let index = 0;
    let nextDate = getRecurringDate(startDate, item.repeat_type, index);

    while (nextDate <= repeatUntil && dates.length < 104) {
      dates.push(nextDate);
      index += 1;
      nextDate = getRecurringDate(startDate, item.repeat_type, index);
    }
  } else if (repeatCount > 1) {
    for (let index = 0; index < repeatCount; index += 1) {
      dates.push(getRecurringDate(startDate, item.repeat_type, index));
    }
  }

  if (dates.length === 0) return [item];

  return dates.map((date) => ({
    ...item,
    schedule_date: getDateKeyLocal(date),
  }));
}

function getChatbotConfig(page) {
  if (page === "schedule") {
    return {
      subtitle: "Thêm lịch học/lịch trình bằng AI",
      placeholder: "Ví dụ: Tôi có môn học thứ 4 lúc 15h đến 17h kéo dài đến tháng 7",
      suggestions: [
        {
          label: "Thêm lịch học lặp lại",
          value: "Tôi có môn học ngày thứ 4 lúc 15h đến 17h và kéo dài đến tháng 7",
        },
        {
          label: "Thêm lịch một lần",
          value: "Ngày 4/5/2026 tôi có đi chơi lúc 15h30",
        },
      ],
    };
  }

  if (page === "tasks") {
    return {
      subtitle: "Thêm nhiệm vụ vào bảng Kanban",
      placeholder: "Ví dụ: Tôi muốn thêm task là tôi sẽ kiếm được 100tr",
      suggestions: [
        {
          label: "Thêm task mục tiêu",
          value: "Tôi muốn thêm task là tôi sẽ kiếm được 100tr",
        },
        {
          label: "Thêm task hôm nay",
          value: "Tôi muốn thêm task là hoàn thành báo cáo",
        },
      ],
    };
  }

  return {
    subtitle: "Thêm task hôm nay hoặc ngày cụ thể",
    placeholder: "Ví dụ: Hôm nay tôi cần làm thêm lúc 9h50",
    suggestions: [
      {
        label: "Thêm task hôm nay",
        value: "Hôm nay tôi cần làm thêm lúc 9h50",
      },
      {
        label: "Thêm việc ngày cụ thể",
        value: "Ngày 4/5/2026 tôi có đi chơi lúc 15h30",
      },
    ],
  };
}

const LANGUAGE_OPTIONS = [
  {
    key: "vi",
    labelKey: "language.vi",
    flagClass: "fi fi-vn",
  },
  {
    key: "en",
    labelKey: "language.en",
    flagClass: "fi fi-us",
  },
];

export default function Header({ user }) {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const [accountOpen, setAccountOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [historyTasks, setHistoryTasks] = useState([]);

  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: "bot",
      text: "Xin chào, mình là Flowly Bot. Mình sẽ hiểu yêu cầu theo trang bạn đang đứng: Home, Lịch trình hoặc Nhiệm vụ.",
    },
  ]);

  const [language, setLanguage] = useState(
    () => localStorage.getItem("flowly_language") || i18n.language || "vi",
  );

  const [pendingLanguage, setPendingLanguage] = useState(
    () => localStorage.getItem("flowly_language") || i18n.language || "vi",
  );

  const [profileDraft, setProfileDraft] = useState({
    fullName: "",
    password: "",
    birthday: "",
    phone: "",
  });

  const accountRef = useRef(null);
  const chatbotRef = useRef(null);

  const displayName = getDisplayName(user);
  const email = user?.email || "minhhuy@gmail.com";
  const avatarUrl = getUserAvatarUrl(user);
  const activePage = useMemo(
    () => getPageContextFromPath(location.pathname),
    [location.pathname],
  );
  const chatbotConfig = useMemo(
    () => getChatbotConfig(activePage),
    [activePage],
  );

  const currentLanguageLabel = useMemo(() => {
    const currentOption = LANGUAGE_OPTIONS.find(
      (item) => item.key === language,
    );

    return currentOption ? t(currentOption.labelKey) : t("language.vi");
  }, [language, t]);

  useEffect(() => {
    function handleClickOutside(event) {
      const target = event.target;

      if (accountRef.current && !accountRef.current.contains(target)) {
        setAccountOpen(false);
      }

      if (chatbotRef.current && !chatbotRef.current.contains(target)) {
        setChatbotOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem("flowly_language", language);

    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }

    window.dispatchEvent(
      new CustomEvent("flowly-language-change", {
        detail: { language },
      }),
    );
  }, [language, i18n]);

  function openEditModal() {
    setProfileDraft({
      fullName: displayName,
      password: "",
      birthday: getUserBirthday(user),
      phone: getUserPhone(user),
    });

    setEditOpen(true);
    setAccountOpen(false);
    setChatbotOpen(false);
  }

  async function saveProfile(event) {
    event.preventDefault();

    const fullName = profileDraft.fullName.trim();
    const password = profileDraft.password.trim();
    const birthday = profileDraft.birthday.trim();
    const phone = profileDraft.phone.trim();

    if (!fullName) {
      alert(t("account.nameRequired"));
      return;
    }

    if (password && password.length < 6) {
      alert(t("account.passwordMin"));
      return;
    }

    try {
      const supabase = await initSupabaseClient();

      const updatePayload = {
        data: {
          full_name: fullName,
          name: fullName,
          birthday,
          phone,
        },
      };

      if (password) {
        updatePayload.password = password;
      }

      const { error } = await supabase.auth.updateUser(updatePayload);

      if (error) {
        throw error;
      }

      setEditOpen(false);
    } catch (error) {
      alert(t("account.updateError") + error.message);
    }
  }

  async function openHistoryModal() {
    try {
      const result = await apiRequest("/api/tasks");
      const completedTasks = (result.tasks || []).filter((task) =>
        ["done", "completed"].includes(task.status || ""),
      );

      setHistoryTasks(completedTasks);
      setHistoryOpen(true);
      setAccountOpen(false);
      setChatbotOpen(false);
    } catch (error) {
      alert(t("account.loadHistoryError") + error.message);
    }
  }

  function openLanguageModal() {
    setPendingLanguage(language);
    setLanguageOpen(true);
    setAccountOpen(false);
    setChatbotOpen(false);
  }

  function confirmLanguageChange() {
    setLanguage(pendingLanguage);
    i18n.changeLanguage(pendingLanguage);
    localStorage.setItem("flowly_language", pendingLanguage);
    document.documentElement.lang = pendingLanguage;
    setLanguageOpen(false);
  }

  function cancelLanguageChange() {
    setPendingLanguage(language);
    setLanguageOpen(false);
  }

  function handleAvatarError(event) {
    event.currentTarget.src = "/assets/images/avatar.png";
  }

  function addChatMessage(role, text) {
    setChatMessages((current) => [
      ...current,
      {
        role,
        text,
      },
    ]);
  }

  function openChatbot() {
    setChatbotOpen((current) => !current);
    setAccountOpen(false);
  }

  async function createTasksFromAi(result) {
    const items = normalizeAiItems(result);
    const createdItems = [];

    if (items.length === 0) {
      addChatMessage("bot", "Mình chưa nhận ra task nào để thêm.");
      return createdItems;
    }

    for (const item of items) {
      const taskDate = item.task_date || getDateKeyLocal(new Date());
      const response = await apiRequest("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: item.title,
          description: item.description || null,
          task_type: item.task_type || "today",
          task_date: taskDate,
          status: activePage === "tasks" ? "new" : "pending",
          priority: item.priority || "normal",
          tag_color: item.tag_color || "orange",
        }),
      });

      createdItems.push(response.task || { ...item, task_date: taskDate });
    }

    addChatMessage(
      "bot",
      `Đã thêm ${items.length} nhiệm vụ: ${items
        .map((item) => item.title)
        .join(", ")}.`,
    );

    return createdItems;
  }

  async function createSchedulesFromAi(result) {
    const items = normalizeAiItems(result).flatMap(expandScheduleItem);
    const createdItems = [];

    if (items.length === 0) {
      addChatMessage("bot", "Mình chưa nhận ra lịch nào để thêm.");
      return createdItems;
    }

    for (const item of items) {
      const response = await apiRequest("/api/schedules", {
        method: "POST",
        body: JSON.stringify({
          title: item.title,
          description: item.description || "",
          schedule_date: item.schedule_date || item.task_date,
          start_time: item.start_time || "09:00:00",
          end_time: item.end_time || addOneHour(item.start_time),
          color: item.color || "blue",
          status: "pending",
        }),
      });

      createdItems.push(response.schedule || item);
    }

    addChatMessage(
      "bot",
      `Đã thêm ${items.length} lịch: ${items
        .map((item) => item.title)
        .join(", ")}.`,
    );

    return createdItems;
  }

  async function handleChatSubmit(event) {
    event.preventDefault();

    const message = chatInput.trim();

    if (!message || chatLoading) {
      return;
    }

    addChatMessage("user", message);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await apiRequest("/api/ai/parse", {
        method: "POST",
        body: JSON.stringify({
          message,
          page: activePage,
          path: location.pathname,
        }),
      });

      const result = response.result;
      let createdItems = [];

      if (result.type === "tasks") {
        createdItems = await createTasksFromAi(result);
      } else if (result.type === "schedule") {
        createdItems = await createSchedulesFromAi(result);
      } else {
        addChatMessage(
          "bot",
          "Mình chưa hiểu yêu cầu này. Bạn thử nhập: Hôm nay tôi cần làm: học tập, đi chơi.",
        );
        return;
      }

      window.dispatchEvent(
        new CustomEvent("flowly-chatbot-created", {
          detail: {
            type: result.type,
            page: activePage,
            items: createdItems,
          },
        }),
      );
    } catch (error) {
      console.log("Chatbot error:", error);
      addChatMessage("bot", "Có lỗi khi xử lý yêu cầu. Bạn thử lại nhé.");
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <a href="/home" className="brand-link" aria-label="Flowly Home">
            <img
              src="/assets/images/logo.png"
              alt="Flowly Logo"
              className="brand-logo"
            />
          </a>

          <p className="today-date">
            {getCurrentDateText(new Date(), language)}
          </p>
        </div>

        <div className="user-area">
          <div className="chatbot-wrap" ref={chatbotRef}>
            <button
              className="chatbot-btn"
              type="button"
              aria-label="Flowly Bot"
              onClick={openChatbot}
            >
              <i className="fa-solid fa-robot" />
              <span className="chatbot-dot" />
            </button>

            <div className={`chatbot-panel ${chatbotOpen ? "show" : ""}`}>
              <div className="chatbot-header">
                <div>
                  <h3>Flowly Bot</h3>
                  <p>{chatbotConfig.subtitle}</p>
                </div>

                <button
                  className="chatbot-close-btn"
                  type="button"
                  onClick={() => setChatbotOpen(false)}
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <div className="chatbot-messages">
                {chatMessages.map((item, index) => (
                  <div
                    className={`chatbot-message ${item.role}`}
                    key={`${item.role}-${index}`}
                  >
                    {item.text}
                  </div>
                ))}
              </div>

              <form className="chatbot-form" onSubmit={handleChatSubmit}>
                <input
                  type="text"
                  placeholder={chatbotConfig.placeholder}
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                />

                <button type="submit" disabled={chatLoading}>
                  <i className="fa-solid fa-paper-plane" />
                </button>
              </form>

              <div className="chatbot-suggestions">
                {chatbotConfig.suggestions.map((suggestion) => (
                  <button
                    type="button"
                    key={suggestion.label}
                    onClick={() => setChatInput(suggestion.value)}
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="user-menu-wrap" ref={accountRef}>
            <button
              className="user-profile"
              type="button"
              onClick={() => setAccountOpen((current) => !current)}
            >
              <span className="user-name">{displayName}</span>
              <img
                src={avatarUrl}
                alt="User Avatar"
                className="avatar"
                referrerPolicy="no-referrer"
                onError={handleAvatarError}
              />
            </button>

            <div className={`account-panel ${accountOpen ? "show" : ""}`}>
              <div className="account-logo-row">
                <img
                  src="/assets/images/logo.png"
                  alt="Flowly Logo"
                  className="account-flowly-logo"
                />
              </div>

              <div className="account-info-card">
                <img
                  src={avatarUrl}
                  alt="User Avatar"
                  className="account-avatar"
                  referrerPolicy="no-referrer"
                  onError={handleAvatarError}
                />

                <div className="account-text">
                  <h3>{displayName}</h3>
                  <p>{email}</p>
                </div>

                <button
                  className="account-edit-btn"
                  type="button"
                  aria-label={t("account.editProfile")}
                  onClick={openEditModal}
                >
                  <i className="fa-solid fa-pen" />
                </button>
              </div>

              <div className="account-actions">
                <button
                  className="account-action-card"
                  type="button"
                  onClick={openHistoryModal}
                >
                  <i className="fa-solid fa-clock-rotate-left" />
                  <span>{t("account.history")}</span>
                </button>

                <button
                  className="account-action-card"
                  type="button"
                  onClick={openLanguageModal}
                >
                  <i className="fa-solid fa-globe" />
                  <span>{t("account.language")}</span>
                  <small>{currentLanguageLabel}</small>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className={`account-modal-overlay ${editOpen ? "show" : ""}`}>
        <div className="account-edit-modal">
          <div className="account-edit-logo-row">
            <img
              src="/assets/images/logo.png"
              alt="Flowly Logo"
              className="account-edit-logo"
            />
          </div>

          <form className="account-edit-form" onSubmit={saveProfile}>
            <label className="account-edit-input">
              <i className="fa-regular fa-circle-user" />
              <input
                type="text"
                placeholder={t("account.name")}
                value={profileDraft.fullName}
                onChange={(event) =>
                  setProfileDraft((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
              />
            </label>

            <label className="account-edit-input">
              <i className="fa-solid fa-key" />
              <input
                type="password"
                placeholder={t("account.newPassword")}
                value={profileDraft.password}
                onChange={(event) =>
                  setProfileDraft((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
              />
            </label>

            <label className="account-edit-input">
              <i className="fa-solid fa-cake-candles" />
              <input
                type="date"
                value={profileDraft.birthday}
                onChange={(event) =>
                  setProfileDraft((current) => ({
                    ...current,
                    birthday: event.target.value,
                  }))
                }
              />
            </label>

            <label className="account-edit-input">
              <i className="fa-solid fa-phone" />
              <input
                type="tel"
                placeholder={t("account.phone")}
                value={profileDraft.phone}
                onChange={(event) =>
                  setProfileDraft((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
              />
            </label>

            <div className="account-edit-actions">
              <button
                className="account-cancel-btn"
                type="button"
                onClick={() => setEditOpen(false)}
              >
                {t("account.cancel")}
              </button>

              <button className="account-submit-btn" type="submit">
                {t("account.confirm")}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className={`account-modal-overlay ${historyOpen ? "show" : ""}`}>
        <div className="account-history-modal">
          <h2>{t("account.completedHistory")}</h2>

          <div className="history-list">
            {historyTasks.length === 0 ? (
              <p className="history-empty">{t("account.noCompletedTasks")}</p>
            ) : (
              historyTasks.map((task) => (
                <div className="history-item" key={task.id}>
                  <div>
                    <h3>{task.title}</h3>
                    <p>{task.description || t("account.noDescription")}</p>
                  </div>

                  <span>
                    {formatTaskDate(
                      task.task_date || task.updated_at,
                      language,
                    )}
                  </span>
                </div>
              ))
            )}
          </div>

          <button
            className="account-submit-btn history-close-btn"
            type="button"
            onClick={() => setHistoryOpen(false)}
          >
            {t("account.close")}
          </button>
        </div>
      </div>

      <div className={`account-modal-overlay ${languageOpen ? "show" : ""}`}>
        <div className="language-modal">
          <h2>{t("language.title")}</h2>

          <div className="language-options">
            {LANGUAGE_OPTIONS.map((item) => (
              <button
                className={`language-option ${
                  pendingLanguage === item.key ? "active" : ""
                }`}
                type="button"
                key={item.key}
                onClick={() => setPendingLanguage(item.key)}
              >
                <span className={`language-flag-icon ${item.flagClass}`} />
                <span>{t(item.labelKey)}</span>
              </button>
            ))}
          </div>

          <div className="language-actions">
            <button
              className="account-cancel-btn language-cancel-btn"
              type="button"
              onClick={cancelLanguageChange}
            >
              {t("account.cancel")}
            </button>

            <button
              className="account-submit-btn language-submit-btn"
              type="button"
              onClick={confirmLanguageChange}
            >
              {t("account.confirm")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
