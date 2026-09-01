/**
 * Транслитерация в латинский slug.
 *
 * Зачем своя таблица, а не готовая библиотека: slug — часть URL, который
 * попадёт в индекс поисковика и больше меняться не должен. Нужен предсказуемый,
 * зафиксированный в коде результат, а не поведение, которое может поехать
 * при обновлении зависимости.
 */

const RU: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

/** Хангыль в латиницу по слогам (пересмотренная романизация, упрощённая). */
const KO_INITIAL = ["g","kk","n","d","tt","r","m","b","pp","s","ss","","j","jj","ch","k","t","p","h"];
const KO_VOWEL = ["a","ae","ya","yae","eo","e","yeo","ye","o","wa","wae","oe","yo","u","wo","we","wi","yu","eu","ui","i"];
const KO_FINAL = ["","k","k","k","n","n","n","t","l","k","m","l","l","l","m","p","l","t","t","ng","t","t","k","t","p","t"];

function romanizeKorean(char: string): string | null {
  const code = char.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return null;
  const index = code - 0xac00;
  const final = index % 28;
  const vowel = ((index - final) / 28) % 21;
  const initial = Math.floor((index - final) / 28 / 21);
  return KO_INITIAL[initial] + KO_VOWEL[vowel] + KO_FINAL[final];
}

export function slugify(input: string): string {
  const lower = input.trim().toLowerCase();
  let out = "";

  for (const char of lower) {
    if (RU[char] !== undefined) {
      out += RU[char];
      continue;
    }
    const korean = romanizeKorean(char);
    if (korean !== null) {
      out += korean + "-";
      continue;
    }
    out += char;
  }

  return out
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // диакритика: é → e
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 200);
}

/**
 * Делает slug уникальным среди уже занятых: «zakat» → «zakat-2».
 * Нужно при массовой загрузке, где легко получить две работы с одним названием.
 */
export function uniqueSlug(base: string, taken: Set<string>): string {
  const slug = base || "work";
  if (!taken.has(slug)) {
    taken.add(slug);
    return slug;
  }
  let n = 2;
  while (taken.has(`${slug}-${n}`)) n += 1;
  const result = `${slug}-${n}`;
  taken.add(result);
  return result;
}
