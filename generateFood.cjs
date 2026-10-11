const fs = require('fs');

const adjectives = ["Ситна", "Ароматна", "Гаряча", "Пряна", "Пікантна", "Ніжна", "Соковита", "Хрустка", "Королівська", "Сільська", "Мисливська", "Запечена", "Смажена", "В'ялена", "Копчена", "Відварена", "Тушкована", "Гостра", "Солодка", "Густа", "Легка", "Поживна"];
const mains = ["вепрова нога", "телятина", "бараняча реберця", "качка", "курка", "риба", "щука", "форель", "оленина", "кабанина", "гусак", "індичка", "ковбаса", "сосиска", "кров'янка", "печінка", "свинина", "яловичина", "кролятина"];
const sides = ["з картоплею", "з грибами", "з капустою", "з морквою", "з бобами", "з часником", "з цибулею", "з кашею", "з яблуками", "з сиром", "з зеленню", "в сметані", "в медовому соусі", "в гірчиці", "у винному соусі", "у пивному соусі"];

const foodTypes = [
    { name: 'суп', emoji: '🥣', descTpl: 'Густа та навариста юшка, яка зігріє навіть у найхолоднішу зиму.' },
    { name: 'м\'ясо', emoji: '🍖', descTpl: 'Щедрий шмат м\'яса, ідеально приготований на відкритому вогні.' },
    { name: 'риба', emoji: '🐟', descTpl: 'Свіжий улов з найближчого озера, запечений за таємним рецептом.' },
    { name: 'птиця', emoji: '🍗', descTpl: 'Ніжна птиця з хрусткою скоринкою, подається з місцевими травами.' },
    { name: 'закуска', emoji: '🧀', descTpl: 'Ідеально пасує до елю або вина. Відновлює сили після довгої дороги.' },
    { name: 'десерт', emoji: '🥧', descTpl: 'Солодкі ласощі, що нагадують про дім і затишок.' }
];

const specificFoods = [
    ["Гарбузовий крем-суп", "🥣", "Густий золотистий суп з додаванням підсмаженого гарбузового насіння та краплинкою вершків. Знімає втому."],
    ["Кабанчик на рожні", "🍖", "Неймовірно соковите м'ясо дикого кабана, яке смажилося всю ніч над вугіллям. Мрія будь-якого воїна."],
    ["Пиріг з кабаниною", "🥧", "Хрустке тісто, що приховує гарячу, ситну начинку з м'яса та спецій."],
    ["Юшка з вугра", "🥣", "Елітна юшка з річкового вугра, приправлена гострим перцем та корінням."],
    ["Медові реберця", "🍖", "Свинячі реберця, покриті густою медовою глазур'ю. Липкі пальці гарантовано."],
    ["Грибна пательня", "🍲", "Асорті з лісових грибів, смажених із картоплею та великою кількістю цибулі у вершковому маслі."],
    ["В'ялена лосятина", "🥩", "Жорстке, але неймовірно поживне м'ясо. Його можна жувати годинами."],
    ["Сирне плато", "🧀", "Витривалі тверді та м'які сири, привезені з різних куточків королівства."],
    ["Смажений фазан", "🍗", "Делікатес для тих, хто втомився від повсякденної їжі. Подається зі сливовим соусом."],
    ["Риба по-селянськи", "🐟", "Проста, але смачна запечена річкова риба з кропом і лимоном."]
];

let foods = [];
let idCounter = 1;

for (const f of specificFoods) {
    let rp = Math.floor(Math.random() * 3) + 1;
    let cost = rp * (Math.floor(Math.random() * 5) + 5);
    foods.push({
        id: `food_${idCounter++}`,
        name: f[0],
        emoji: f[1],
        description: f[2],
        regenPoints: rp,
        cost: cost
    });
}

let attempts = 0;
while (foods.length < 150 && attempts < 1000) {
    attempts++;
    let adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    let main = mains[Math.floor(Math.random() * mains.length)];
    let side = sides[Math.floor(Math.random() * sides.length)];
    
    let name = `${adj} ${main} ${side}`;
    if (!foods.some(f => f.name === name)) {
        let rp = Math.floor(Math.random() * 4) + 1;
        let cost = rp * (Math.floor(Math.random() * 4) + 3) + Math.floor(Math.random() * 5);
        
        let tpl = foodTypes[Math.floor(Math.random() * foodTypes.length)];
        let desc = tpl.descTpl + ` Готується з любов'ю за старовинним рецептом.`;
        
        const extraLore = [" Справжній шедевр місцевого кухаря.", " Багато хто приїжджає сюди лише заради цієї страви.", " Рецепт тримається в суворій таємниці.", " Додає неймовірної сили та наснаги.", " Ідеальний вибір для зголоднілого мандрівника.", " Навіть ельфи схвалюють цю страву."];
        desc += extraLore[Math.floor(Math.random() * extraLore.length)];

        foods.push({
            id: `food_${idCounter++}`,
            name: name,
            emoji: tpl.emoji,
            description: desc,
            regenPoints: rp,
            cost: cost
        });
    }
}

const fileContent = `export interface FoodItem {
    id: string;
    name: string;
    emoji: string;
    description: string;
    regenPoints: number;
    cost: number;
}

export const FOOD_DATABASE: FoodItem[] = ${JSON.stringify(foods, null, 4)};

export function getRandomFoods(count: number): FoodItem[] {
    const shuffled = [...FOOD_DATABASE].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}
`;

fs.writeFileSync('src/lib/foodData.ts', fileContent);
console.log(`Generated ${foods.length} food items.`);
