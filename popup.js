"use strict";

const $ = id => document.getElementById(id);

const DEFAULT_SETTINGS = {
  eveningTime: "21:00",
  morningTime: "08:00",
  notificationsEnabled: true
};

let goalsByDate = {};
let settings = { ...DEFAULT_SETTINGS };

function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function tomorrowKey() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return dateKey(date);
}

function goalsFor(date) {
  return goalsByDate[date] || [];
}

async function loadData() {
  const data = await browser.storage.local.get([
    "goals", "settings"
  ]);

  goalsByDate = data.goals || {};
  settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
}

async function saveGoals() {
  await browser.storage.local.set({ goals: goalsByDate });
}

function showView(name) {
  document.querySelectorAll(".view").forEach(section => {
    section.hidden = section.id !== `${name}-view`;
  });

  document.querySelectorAll("[data-view]").forEach(button => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.view === name)
    );
  });
}

function renderGoals(date, listId, emptyId, editable) {
  const list = $(listId);
  list.replaceChildren();

  const goals = goalsFor(date);
  $(emptyId).hidden = goals.length > 0;

  goals.forEach(goal => {
    const item = document.createElement("li");
    item.className = `goal-item${goal.completed ? " completed" : ""}`;

    const top = document.createElement("div");
    top.className = "goal-top";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(goal.completed);
    checkbox.setAttribute(
      "aria-label",
      `Mark ${goal.name} as ${goal.completed ? "incomplete" : "complete"}`
    );

    checkbox.addEventListener("change", async () => {
      goal.completed = checkbox.checked;
      await saveGoals();
      renderAll();
    });

    const content = document.createElement("div");
    content.className = "goal-content";

    const name = document.createElement("div");
    name.className = "goal-name";
    name.textContent = goal.name;

    content.append(name);

    if (goal.description) {
      const description = document.createElement("p");
      description.className = "goal-description";
      description.textContent = goal.description;
      content.append(description);
    }

    if (goal.plannedTime) {
      const time = document.createElement("div");
      time.className = "goal-time";
      time.textContent = `Planned: ${goal.plannedTime}`;
      content.append(time);
    }

    top.append(checkbox, content);
    item.append(top);

    if (editable) {
      const actions = document.createElement("div");
      actions.className = "goal-actions";

      const edit = document.createElement("button");
      edit.type = "button";
      edit.textContent = "Edit";
      edit.setAttribute("aria-label", `Edit ${goal.name}`);
      edit.addEventListener("click", () => startEdit(goal));

      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Delete";
      remove.setAttribute("aria-label", `Delete ${goal.name}`);
      remove.addEventListener("click", async () => {
        goalsByDate[date] = goalsFor(date).filter(
          entry => entry.id !== goal.id
        );
        await saveGoals();
        renderAll();
      });

      actions.append(edit, remove);
      item.append(actions);
    }

    list.append(item);
  });
}

function renderAll() {
  const today = dateKey();
  const todayGoals = goalsFor(today);
  const completed = todayGoals.filter(g => g.completed).length;

  $("current-date").textContent = new Date().toLocaleDateString(
    undefined,
    { weekday: "short", day: "numeric", month: "short", year: "numeric" }
  );

  $("today-summary").textContent = todayGoals.length
    ? `${completed} of ${todayGoals.length} goals completed`
    : "Make today count, one step at a time.";

  renderGoals(today, "today-list", "today-empty", false);
  renderGoals(tomorrowKey(), "tomorrow-list", "tomorrow-empty", true);
}

function resetGoalForm() {
  $("goal-form").reset();
  $("goal-id").value = "";
  $("save-goal").textContent = "Add goal";
  $("cancel-edit").hidden = true;
}

function startEdit(goal) {
  $("goal-id").value = goal.id;
  $("goal-name").value = goal.name;
  $("goal-description").value = goal.description || "";
  $("planned-time").value = goal.plannedTime || "";
  $("save-goal").textContent = "Save changes";
  $("cancel-edit").hidden = false;
  showView("tomorrow");
  $("goal-name").focus();
}

$("goal-form").addEventListener("submit", async event => {
  event.preventDefault();

  const name = $("goal-name").value.trim();

  if (!name) {
    $("goal-name").focus();
    return;
  }

  const date = tomorrowKey();
  const goals = [...goalsFor(date)];
  const id = $("goal-id").value;

  const goal = {
    id: id || crypto.randomUUID(),
    name,
    description: $("goal-description").value.trim(),
    plannedTime: $("planned-time").value,
    completed: id
      ? Boolean(goals.find(g => g.id === id)?.completed)
      : false
  };

  const index = goals.findIndex(g => g.id === goal.id);

  if (index >= 0) {
    goals[index] = goal;
  } else {
    goals.push(goal);
  }

  goalsByDate[date] = goals;
  await saveGoals();

  resetGoalForm();
  $("form-status").textContent = "Goal saved.";
  renderAll();
});

$("cancel-edit").addEventListener("click", resetGoalForm);

$("plan-button").addEventListener("click", () => {
  showView("tomorrow");
});

document.querySelectorAll("[data-view]").forEach(button => {
  button.addEventListener("click", () => showView(button.dataset.view));
});

$("settings-form").addEventListener("submit", async event => {
  event.preventDefault();

  const eveningTime = $("evening-time").value;
  const morningTime = $("morning-time").value;

  if (!eveningTime || !morningTime) {
    $("settings-status").textContent = "Choose both reminder times.";
    return;
  }

  settings = {
    eveningTime,
    morningTime,
    notificationsEnabled: $("notifications-enabled").checked
  };

  await browser.storage.local.set({ settings });

  $("settings-status").textContent = "Settings saved.";
});

async function init() {
  try {
    await loadData();

    $("evening-time").value = settings.eveningTime;
    $("morning-time").value = settings.morningTime;
    $("notifications-enabled").checked =
      settings.notificationsEnabled;

    renderAll();

    const requestedView = new URLSearchParams(location.search).get("view");
    showView(
      ["today", "tomorrow", "settings"].includes(requestedView)
        ? requestedView
        : "today"
    );
  } catch (error) {
    console.error("GoalReminder initialization failed:", error);
    $("today-summary").textContent =
      "Could not load your goals. Please reload the extension.";
  }
}

init();