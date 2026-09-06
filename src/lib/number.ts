export const toNumber = (text: string) => Number(text.replace(/[^\d]/g, '')) || 0;
