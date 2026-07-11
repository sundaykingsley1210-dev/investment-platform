export interface CardValidation {
  isValid: boolean;
  cardType: string;
  errors: string[];
}

const CARD_PATTERNS: Record<string, { pattern: RegExp; lengths: number[] }> = {
  Visa: { pattern: /^4/, lengths: [16] },
  Mastercard: { pattern: /^(5[1-5]|2[2-7])/, lengths: [16] },
  Verve: { pattern: /^(506[0-9]|6500)/, lengths: [16] },
  "American Express": { pattern: /^(3[47])/, lengths: [15] },
  Discover: { pattern: /^(6011|65|64[4-9])/, lengths: [16] },
};

function luhnCheck(cardNumber: string): boolean {
  let sum = 0;
  let alternate = false;
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let n = parseInt(cardNumber[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

export function detectCardType(first4: string): string {
  for (const [type, { pattern }] of Object.entries(CARD_PATTERNS)) {
    if (pattern.test(first4)) return type;
  }
  return "Unknown";
}

export function validateCardNumber(first4: string, last4: string): CardValidation {
  const errors: string[] = [];

  if (!/^\d{4}$/.test(first4)) {
    errors.push("First 4 digits must be exactly 4 numbers");
  }

  if (!/^\d{4}$/.test(last4)) {
    errors.push("Last 4 digits must be exactly 4 numbers");
  }

  if (first4 === "0000" || last4 === "0000") {
    errors.push("Card digits cannot be all zeros");
  }

  if (first4 === "1234" && last4 === "5678") {
    errors.push("This is a test card number");
  }

  const cardType = detectCardType(first4);

  if (first4.startsWith("0") || first4.startsWith("1") || first4.startsWith("2") || first4.startsWith("3") || first4.startsWith("8") || first4.startsWith("9")) {
    const knownPrefix = Object.values(CARD_PATTERNS).some(({ pattern }) => pattern.test(first4));
    if (!knownPrefix) {
      errors.push("Invalid card prefix - not a recognized card type");
    }
  }

  if (cardType === "Unknown") {
    errors.push("Card type not recognized (Visa, Mastercard, Verve accepted)");
  }

  const testNumbers = ["0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999"];
  if (testNumbers.includes(first4) && testNumbers.includes(last4)) {
    errors.push("Suspicious card pattern detected");
  }

  const sampleCard = first4 + "00000000" + last4;
  const passesLuhn = luhnCheck(sampleCard);

  return {
    isValid: errors.length === 0,
    cardType,
    errors,
  };
}
