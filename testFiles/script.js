const monthLabel = document.getElementById("monthLabel");
const calendarDays = document.getElementById("calendarDays");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

let currentDate = new Date();

function renderCalendar() {

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthLabel.textContent = currentDate.toLocaleString("default", {
        month: "long",
        year: "numeric"
    });

    calendarDays.innerHTML = "";

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    // Empty cells before month starts
    for (let i = 0; i < firstDayIndex; i++) {
        const emptyCell = document.createElement("div");
        calendarDays.appendChild(emptyCell);
    }

    // Numbered days
    for (let day = 1; day <= lastDate; day++) {

        const dayDiv = document.createElement("div");
        dayDiv.classList.add("day");

        const number = document.createElement("div");
        number.classList.add("date-number");
        number.textContent = day;

        dayDiv.appendChild(number);

        const today = new Date();
        if (
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        ) {
            dayDiv.classList.add("today");
        }

        calendarDays.appendChild(dayDiv);
    }
}

prevBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

nextBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

renderCalendar();
