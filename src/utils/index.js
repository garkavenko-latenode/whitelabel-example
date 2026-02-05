export function addLeadingZero(string) {
  return `0${string}`.slice(`${string}`.length - 1);
}

export function getDateTimeString(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();

  return `${year}-${addLeadingZero(month)}-${addLeadingZero(day)}T${addLeadingZero(hour)}:${addLeadingZero(minute)}`;
}

export function getDefaultExpireDate() {
  return getDateTimeString(new Date(new Date().getTime() + 1 * 60 * 60 * 1000));
}
