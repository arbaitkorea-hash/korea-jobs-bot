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

/**
 * Хангыль в латиницу по слогам (пересмотренная романизация, упрощённая).
 *
 * Длина таблиц жёстко задана кодировкой слога: 19 начальных, 21 гласная,
 * 28 финальных (нулевая — «финала нет»). Ошибка в одном элементе сдвигает
 * весь хвост таблицы, поэтому здесь стоит проверка длины — на такой ошибке
 * уже один раз получили «폭풍» → «pokput» вместо «pokpung».
 */
const KO_INITIAL = ["g","kk","n","d","tt","r","m","b","pp","s","ss","","j","jj","ch","k","t","p","h"];
const KO_VOWEL = ["a","ae","ya","yae","eo","e","yeo","ye","o","wa","wae","oe","yo","u","wo","we","wi","yu","eu","ui","i"];
const KO_FINAL = ["","k","k","k","n","n","n","t","l","k","m","l","l","l","p","l","m","p","p","t","t","ng","t","t","k","t","p","t"];

if (KO_INITIAL.length !== 19 || KO_VOWEL.length !== 21 || KO_FINAL.length !== 28) {
  throw new Error("Таблицы романизации хангыля повреждены: неверная длина.");
}

/**
 * Финальная согласная, переехавшая в начало следующего слога. Пустая строка —
 * согласная при переносе исчезает (ㅎ), null — переносить нельзя.
 */
const KO_LIAISON: Record<number, string | null> = {
  1: "g", 2: "kk", 4: "n", 7: "d", 8: "r", 16: "m", 17: "b", 19: "s", 20: "ss",
  22: "j", 23: "ch", 24: "k", 25: "t", 26: "p", 27: "",
};

type Syllable = { initial: number; vowel: number; final: number };

function decompose(char: string): Syllable | null {
  const code = char.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return null;
  const index = code - 0xac00;
  const final = index % 28;
  const vowel = ((index - final) / 28) % 21;
  const initial = Math.floor((index - final) / 28 / 21);
  return { initial, vowel, final };
}

/**
 * Романизация корейского слова.
 *
 * Из правил пересмотренной романизации применяется только связывание
 * (연음): конечная согласная переходит в следующий слог, если тот начинается
 * с немой ㅇ — «한국의» читается «hangugui», а не «hangukui». Полная таблица
 * ассимиляций согласных (например 산책로 → sanchaengno) намеренно не
 * реализована: она объёмна, а на читаемость адреса влияет слабо.
 */
function romanizeKoreanRun(chars: Syllable[]): string {
  let out = "";

  for (let i = 0; i < chars.length; i += 1) {
    const s = chars[i];
    const prev = chars[i - 1];
    const next = chars[i + 1];
    // Индекс 11 в списке начальных — немая ㅇ (у неё пустая романизация).
    const nextIsSilent = next !== undefined && next.initial === 11;
    const moved = nextIsSilent ? KO_LIAISON[s.final] : undefined;

    // Единственная ассимиляция, которую разбираем: ㄹ после ㄹ читается «l»,
    // а не «r» («졸로타리» → «jollotari»). Сочетание частое, правило дешёвое.
    const initial = prev?.final === 8 && s.initial === 5 ? "l" : KO_INITIAL[s.initial];

    out += initial + KO_VOWEL[s.vowel];
    // Следующий слог начинается с немой ㅇ, поэтому перенесённую согласную
    // достаточно дописать здесь — она встанет ровно перед его гласной.
    out += moved !== undefined && moved !== null ? moved : KO_FINAL[s.final];
  }

  return out;
}

export function slugify(input: string): string {
  const lower = input.trim().toLowerCase();
  let out = "";

  // Корейские слоги копим в цепочку и переводим целым словом: связывание
  // согласных работает через границу слогов, посимвольно его не увидеть.
  let run: Syllable[] = [];
  const flush = () => {
    if (run.length > 0) {
      out += romanizeKoreanRun(run);
      run = [];
    }
  };

  for (const char of lower) {
    const syllable = decompose(char);
    if (syllable) {
      run.push(syllable);
      continue;
    }
    flush();
    out += RU[char] !== undefined ? RU[char] : char;
  }
  flush();

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
