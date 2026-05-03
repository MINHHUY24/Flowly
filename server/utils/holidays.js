const Holidays = require("date-holidays");

const hd = new Holidays("VN");

function getHolidayMap(year) {
  const holidays = hd.getHolidays(year);
  const map = {};

  holidays.forEach((holiday) => {
    const date = new Date(holiday.date);

    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const key = `${month}-${day}`;

    map[key] = holiday.name;
  });

  return map;
}

module.exports = {
  getHolidayMap,
};
