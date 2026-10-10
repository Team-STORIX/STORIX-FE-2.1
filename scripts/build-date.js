const KOREA_TIME_ZONE = "Asia/Seoul";

const buildDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: KOREA_TIME_ZONE,
  year: "2-digit",
  month: "2-digit",
  day: "2-digit",
});

const getKoreaBuildDate = (date = new Date()) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new TypeError("A valid Date is required to calculate the build date.");
  }

  const parts = Object.fromEntries(
    buildDateFormatter
      .formatToParts(date)
      .filter(({ type }) => type === "year" || type === "month" || type === "day")
      .map(({ type, value }) => [type, value]),
  );

  if (!parts.year || !parts.month || !parts.day) {
    throw new Error("Failed to calculate the Korea build date.");
  }

  return `${parts.year}.${parts.month}.${parts.day}`;
};

module.exports = {
  KOREA_TIME_ZONE,
  getKoreaBuildDate,
};
