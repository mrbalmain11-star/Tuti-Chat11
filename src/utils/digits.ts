export function latinDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, digit => {
    const code = digit.charCodeAt(0);
    return String(code - (code < 0x06f0 ? 0x0660 : 0x06f0));
  });
}

export function integerDigits(value: string): string {
  return latinDigits(value).replace(/[^0-9]/g, '');
}
