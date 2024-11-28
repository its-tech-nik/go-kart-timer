// pad numbers to 2 digits
const padTo2Digits = (num: number) => {
  return num.toString().padStart(2, "0");
};

// format time for the timer display
const formatTime = (time: number | undefined) => {
  if (!time && time !== 0) return;

  const minutes = Math.floor(time / 60000);
  const seconds = Math.floor((time % 60000) / 1000);
  const milliseconds = (time - (minutes * 60000 + seconds * 1000))
    .toString()
    .padStart(3, "0");

  if (minutes > 0)
    return `${padTo2Digits(minutes)}:${padTo2Digits(seconds)}.${milliseconds}`;

  return `${padTo2Digits(seconds)}.${milliseconds}`;
};

export { formatTime };
