const fs = require('fs');

const files = [
    'src/components/AsebModal.tsx',
    'src/components/CheckersModal.tsx',
    'src/components/ClassicDurakModal.tsx',
    'src/components/DicePokerModal.tsx',
    'src/components/MehenModal.tsx',
    'src/components/SenetModal.tsx',
    'src/components/TavernDiceModal.tsx',
    'src/components/UrModal.tsx',
    'src/components/DuelResultModal.tsx'
];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');

    // 1. Add expectedXpReward to interface
    const interfaceMatch = content.match(/interface\s+\w+Props\s*{/);
    if (interfaceMatch && !content.includes('expectedXpReward?: number;')) {
        content = content.replace(interfaceMatch[0], interfaceMatch[0] + '\n    expectedXpReward?: number;');
    }

    // 2. Add to destructuring
    const compMatch = content.match(/(export function\s+\w+\(\{\s*[\s\S]*?)(?=\}:)/);
    if (compMatch && !content.includes('expectedXpReward,')) {
        content = content.replace(compMatch[0], compMatch[0] + ',\n    expectedXpReward');
    }

    // 3. Replace opponent.rewards.xp
    content = content.replace(/opponent\.rewards\.xp\s*\|\|\s*\d+/g, (match) => {
        return `(expectedXpReward ?? (${match}))`;
    });
    // In some components it might be just opponent.rewards.xp
    content = content.replace(/\{\s*opponent\.rewards\.xp\s*\}/g, '{expectedXpReward ?? opponent.rewards.xp}');
    
    fs.writeFileSync(file, content);
}
