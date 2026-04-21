export const numberToWords = (num) => {
  if (num === null || num === undefined || isNaN(num)) return "";

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six",
    "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
    "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];

  const b = [
    "", "", "Twenty", "Thirty", "Forty",
    "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  const inWords = (n) => {
    if (n === 0) return "";
    if (n < 20) return a[n];
    if (n < 100)
      return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 ? " " + inWords(n % 100) : "")
      );
    if (n < 1000000)
      return (
        inWords(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 ? " " + inWords(n % 1000) : "")
      );

    // ✅ ADD THIS BLOCK
    if (n < 1000000000)
      return (
        inWords(Math.floor(n / 1000000)) +
        " Million" +
        (n % 1000000 ? " " + inWords(n % 1000000) : "")
      );

    return n.toString(); // fallback
  };

  const whole = Math.floor(num);
  const fraction = Math.round((num - whole) * 100);

  let words = inWords(whole) + " Naira";

  if (fraction > 0) {
    words += " and " + inWords(fraction) + " Kobo";
  }

  return words.trim() + " Only";
};
