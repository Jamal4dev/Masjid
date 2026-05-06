const prayerSchedule = [
  { name: 'Fajr', time: '5:45 AM' },
  { name: 'Dhuhr', time: '1:05 PM' },
  { name: 'Asr', time: '4:10 PM' },
  { name: 'Maghrib', time: '7:05 PM' },
  { name: 'Isha', time: '8:10 PM' },
];

const events = buildEventSchedule();
let activeDate = new Date();
let timerId = null;

function buildEventSchedule() {
  const today = new Date();
  const nextFriday = getNextWeekdayDate(5, today);
  const nextSaturday = getNextWeekdayDate(6, today);
  const nextWednesday = getNextWeekdayDate(3, today);
  const nextSunday = getNextWeekdayDate(0, today);

  return [
    {
      date: formatISODate(nextFriday),
      title: "Jumu'ah Prayer & Khutbah",
      time: '2:30 PM',
      details: 'Join the congregational Friday prayer with a community sermon and fellowship.',
    },
  ];
}

function formatISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatFriendlyDate(date) {
  const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-GB', options);
}

function getNextWeekdayDate(weekday, reference = new Date()) {
  const date = new Date(reference);
  const delta = (weekday + 7 - date.getDay()) % 7 || 7;
  date.setDate(date.getDate() + delta);
  return date;
}

function timeStringToDate(timeString, reference = new Date()) {
  const [time, period] = timeString.split(' ');
  const [hour, minute] = time.split(':').map(Number);
  const date = new Date(reference);
  const normalizedHour = hour % 12 + (period === 'PM' ? 12 : 0);
  date.setHours(normalizedHour, minute, 0, 0);
  return date;
}

function createCalendarDays(year, month) {
  const calendarGrid = document.getElementById('calendarGrid');
  calendarGrid.innerHTML = '';

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayNames.forEach(name => {
    const label = document.createElement('span');
    label.textContent = name;
    calendarGrid.appendChild(label);
  });

  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < startDay; i += 1) {
    const placeholder = document.createElement('div');
    placeholder.className = 'calendar-day empty';
    calendarGrid.appendChild(placeholder);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const current = new Date(year, month, day);
    const dayNode = document.createElement('div');
    dayNode.className = 'calendar-day';
    dayNode.dataset.date = formatISODate(current);
    dayNode.innerHTML = `<strong>${day}</strong>`;

    const dateKey = formatISODate(current);
    if (events.some(event => event.date === dateKey)) {
      dayNode.classList.add('has-event');
    }

    const today = new Date();
    if (current.toDateString() === today.toDateString()) {
      dayNode.classList.add('today');
    }

    dayNode.addEventListener('click', () => renderEventList(dateKey));
    calendarGrid.appendChild(dayNode);
  }
}

function renderEventList(selectedDate = null) {
  const eventList = document.getElementById('eventList');
  eventList.innerHTML = '';

  let filteredEvents = events;
  if (selectedDate) {
    filteredEvents = events.filter(event => event.date === selectedDate);
  } else {
    filteredEvents = events
      .filter(event => new Date(event.date) >= new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  if (filteredEvents.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.textContent = selectedDate
      ? 'No mosque events are scheduled for this day.'
      : 'No upcoming events are available right now.';
    eventList.appendChild(emptyItem);
    return;
  }

  filteredEvents.forEach(event => {
    const item = document.createElement('li');
    item.innerHTML = `
      <strong>${event.title}</strong>
      <span>${formatFriendlyDate(new Date(event.date))} · ${event.time}</span>
      <p>${event.details}</p>
    `;
    eventList.appendChild(item);
  });
}

function getNextPrayer() {
  const now = new Date();
  const todayPrayers = prayerSchedule.map(entry => ({
    ...entry,
    date: timeStringToDate(entry.time, now),
  }));

  const upcoming = todayPrayers.filter(entry => entry.date > now);
  if (upcoming.length > 0) {
    return upcoming[0];
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return {
    ...prayerSchedule[0],
    date: timeStringToDate(prayerSchedule[0].time, tomorrow),
  };
}

function formatCountdown(milliseconds) {
  if (milliseconds <= 0) {
    return 'The next prayer time has arrived.';
  }

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

function updatePrayerDisplay() {
  const now = new Date();
  const nextPrayer = getNextPrayer();
  const nextPrayerName = document.getElementById('nextPrayerName');
  const nextPrayerTime = document.getElementById('nextPrayerTime');
  const countdownText = document.getElementById('countdownText');
  const todayDate = document.getElementById('todayDate');
  const prayerTable = document.getElementById('prayerTable');

  todayDate.textContent = `Today: ${formatFriendlyDate(now)}`;
  nextPrayerName.textContent = nextPrayer.name;
  nextPrayerTime.textContent = nextPrayer.time;
  countdownText.textContent = `Starts in ${formatCountdown(nextPrayer.date - now)}`;

  prayerTable.innerHTML = prayerSchedule
    .map(entry => {
      const entryDate = timeStringToDate(entry.time, now);
      const rowClass = entry.name === nextPrayer.name ? 'prayer-row next' : 'prayer-row';
      return `
        <div class="${rowClass}">
          <strong>${entry.name}</strong>
          <span>${entry.time}</span>
        </div>
      `;
    })
    .join('');
}

function renderCalendar() {
  const month = activeDate.getMonth();
  const year = activeDate.getFullYear();
  document.getElementById('calendarMonth').textContent = activeDate.toLocaleString('en-GB', { month: 'long' });
  document.getElementById('calendarYear').textContent = year;
  createCalendarDays(year, month);
  renderEventList();
}

function initializeCalendarButtons() {
  document.getElementById('prevMonth').addEventListener('click', () => {
    activeDate.setMonth(activeDate.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById('nextMonth').addEventListener('click', () => {
    activeDate.setMonth(activeDate.getMonth() + 1);
    renderCalendar();
  });
}

function init() {
  renderCalendar();
  initializeCalendarButtons();
  updatePrayerDisplay();
  if (timerId) {
    clearInterval(timerId);
  }
  timerId = setInterval(updatePrayerDisplay, 1000);
}

window.addEventListener('DOMContentLoaded', init);
