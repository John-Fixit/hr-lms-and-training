export const numberToWord = (value) => {
  if (isNaN(value)) return "";

  const [integerPart, decimalPart] = String(value).split(".");
  let valueInNumber = Number(integerPart);

  if (valueInNumber === 0) return "Zero";

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];

  const teens = [
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "Ten",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const thousands = ["", "Thousand", "Million", "Billion"];

  function convertChunk(num) {
    let str = "";

    if (num >= 100) {
      str += ones[Math.floor(num / 100)] + " Hundred";
      num %= 100;
      if (num > 0) str += " and ";
    }

    if (num >= 11 && num <= 19) {
      str += teens[num - 11];
    } else {
      if (num >= 10) str += tens[Math.floor(num / 10)] + " ";
      if (num % 10 !== 0) str += ones[num % 10];
    }

    return str.trim();
  }

  let word = "";
  let i = 0;

  while (valueInNumber > 0) {
    const chunk = valueInNumber % 1000;
    if (chunk !== 0) {
      const chunkWord = convertChunk(chunk);
      word = chunkWord + (thousands[i] ? " " + thousands[i] : "") + " " + word;
    }
    valueInNumber = Math.floor(valueInNumber / 1000);
    i++;
  }

  word = word.trim();
  let decimalWords = "";

  // Handle decimal part if exists
  if (decimalPart && Number(decimalPart) > 0) {
    decimalWords = decimalPart
      .split("")
      .map((digit) => ones[Number(digit)])
      .join(" ");
    // word += `, ${decimalWords} kobo`;
  }

  return {
    naira: word.trim(),
    kobo: decimalWords.trim(),
  };
};
