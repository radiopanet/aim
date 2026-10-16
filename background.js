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
}