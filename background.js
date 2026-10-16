"use strict"

const DEFAULT_SETTINGS = {
    eveningTime: "19:00",
    morningTime: "08:00",
    notificationEnabled: true
};

const EVENING_ALARM = "aim-evening";
const MORNING_ALARM = "aim-morning";

function getDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getTomorrowKey(date = new Date()) {
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return getDateKey(tomorrow);
}

function timeToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

function isValidTime(time) {
    return typeof time === "string" &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

//Return the next local occurence of a daily reminder
function nextOccurence(time, now = new Date()) {
    const [hours, minutes] = time.split(":").map(Number);
    const next = new Date(now);

    next.setHours(hours, minutes, 0, 0);

    if(next <= now) {
        next.setDate(next.getDate() + 1);
    }

    return next.getTime();
}

async function getData() {
    const data = await browser.storage.local.get([
        "goals",
        "settings",
        "lastMorningCheck",
        "lastEveningCheck"
    ]);

    return {
        goals: data.goals || {},
        settings: {
            ...DEFAULT_SETTINGS,
            ...(data.settings || {})
        },
        lastMorningCheck: data.lastMorningCheck || "",
        lastEveningCheck: data.lastEveningCheck || ""
    };
}

async function showNotification(title, message, view) {
    const { settings } = await getData();

    if(!settings.notificationEnabled) {
        return;
    }

    await browser.notifications.create(`aim-${view}`, {
        type: "basic",
        title,
        message,
        iconUrl: browser.runtime.getUrl("icon.svg")
    });
}

async function showEveningReminder() {
    const today = getDateKey();
    const data = await getData();

    if(data.lastEveningCheck === today) return;

    //Mark this date so startup checks cannot duplicate the reminder
    await browser.storage.local.set({
        lastEveningCheck: today
    });

    await showNotification(
        "Plan tomorrow with Aim",
        "Take a moment to set your goals for tomorrow.",
        "tomorrow"
    );
}

async function showMorningReminder() {
    const today = getDateKey();
    const data = await getData();

    if(data.lastMorningCheck === today) return;

    //Mark before notifying to prevent duplicate alerts.
    await browser.storage.local.set({
        lastMorningCheck: today
    });

    const goals = data.goals[today] || [];
    const remaining = goals.filter(goal => !goal.completed).length;

    let message;

    if(goals.length === 0) {
        message = "No goals planned for today. Open Aim to get started.";
    } else if (remaining === 0) {
        message = "All your goals for today are already complete. well done!";
    } else {
        message = `You have ${remaining} tasks to complete today`;
    }
    
    await showNotification(
        "Good morning! Your daily goals",
        message,
        "today"
    );
}

async function scheduleAlarms() {
    const { settings } = await getData();

    //Remove old schedules before applying the lates settings.
    await browser.alarms.clear(EVENING_ALARM);
    await browser.alarms.clear(MORNING_ALARM);

    if(!isValidTime(settings.eveningTime) ||
       !isValidTime(settings.morningTime)) {
        return;
    }

    await browser.alarms.create(EVENING_ALARM, {
        when: nextOccurence(settings.eveningTime)
    });

    await browser.alarms.create(MORNING_ALARM, {
        when: nextOccurence(settings.morningTime)
    });
}

async function checkMissedReminders() {
    const now = new Date();
    const data = await getData();
    const today = getDateKey(now);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    //Show reminders missed while Firefox was closed
    if (
        isValidTime(data.settings.morningTime) &&
        currentMinutes >= timeToMinutes(data.settings.morningTime) &&
        data.lastMorningCheck !== today
    ){
        await showEveningReminder();
    }

    await scheduleAlarms();
}

browser.alarms.onAlarm.addListener(async alarm => {
    try {
        if(alarm.name === EVENING_ALARM) {
            await showEveningReminder();
        } else if(alarm.name === MORNING_ALARM) {
            await showMorningReminder();
        }

        await scheduleAlarms();
    } catch (error) {
        console.error("Aim alarm error:", error);
    }
});

browser.notifications.onClicked.addListener(notificationId => {
    let view;

    if(notificationId === "aim-tomorrow"){
        view = "tomorrow";
    } else if (notificationId === "aim-today") {
        view = "today";
    } else {
        return;
    }

    browser.tabs.create({
        url: browser.runtime.getUrl(`popup.html?view=${view}`)
    });
});

//React to changed reminder settings
browser.storage.onChanged.addListener((changes, area) => {
    if(area === "local" && changes.settings) {
        scheduleAlarms().catch(console.error);
    }
});

//Recheck the date and time whenever Firefox starts.
browser.runtime.onStartup.addListener(() => {
    checkMissedReminders().catch(console.error);
});

//Also run during initial extention installation or reload
browser.runtime.onInstalled.addListener(() => {
    checkMissedReminders().catch(console.error);
});

//A newly evaluated background script also needs schedules.
checkMissedReminders().catch(console.error);