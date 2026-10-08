const AZ_MAP: Record<string, string> = {
  ə: "e",
  ı: "i",
  ö: "o",
  ü: "u",
  ç: "c",
  ş: "s",
  ğ: "g",
};

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[əıöüçşğ]/g, (char) => AZ_MAP[char] ?? char)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^a-z0-9]+/g, "-") 
    .replace(/^-+|-+$/g, ""); 