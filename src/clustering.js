import cluster from 'set-clustering';
import anyAscii from 'any-ascii';

const allowedKeys = new Set([
    'name',
    'description',
    'scenario',
    'personality',
    'first_mes',
    'mes_example',
]);

const cleanAndTokenizeTextCache = new Map();
const similarityCache = new Map();

const generateTextCacheKey = (dateAdded, key) => {
    return `${dateAdded}-${key}`;
}

const cleanAndTokenizeText = (text, dateAdded, key) => {
    const cacheKey = generateTextCacheKey(dateAdded, key);

    if (cleanAndTokenizeTextCache.has(cacheKey)) {
        return cleanAndTokenizeTextCache.get(cacheKey);
    }

    const asciiText = anyAscii(text);
    const cleanedText = asciiText.replace(/[^a-zA-Z0-9 ]/g, '').toLowerCase();
    const normalizedText = cleanedText.replace(/\s+/g, ' ').trim();
    const tokenizedText = normalizedText.split(' ').filter(word => word.length > 0);

    cleanAndTokenizeTextCache.set(cacheKey, tokenizedText);

    return tokenizedText;
}

const generateCacheKey = (id1, id2) => {
    return id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
}

const similarity = (x, y) => {
    const cacheKey = generateCacheKey(x['date_added'], y['date_added']);

    if (similarityCache.has(cacheKey)) {
        return similarityCache.get(cacheKey);
    }

    let score = 0;
    let matchedKeys = 0;

    for (const key of allowedKeys) {
        const value1 = x.data[key] || '';
        const value2 = y.data[key] || '';

        if (value1 === '' || value2 === '') {
            continue;
        }

        const sentences1 = new Set(cleanAndTokenizeText(value1, x['date_added'], key));
        const sentences2 = new Set(cleanAndTokenizeText(value2, y['date_added'], key));

        const intersection = new Set([...sentences1].filter(s => sentences2.has(s)));

        const totalUniqueSentences = new Set([...sentences1, ...sentences2]);

        if (totalUniqueSentences.size > 0) {
            let similarity = intersection.size / totalUniqueSentences.size;

            score += similarity;
            matchedKeys++;
        }
    }

    let finalScore = matchedKeys === 0 ? 0 : score / matchedKeys;

    similarityCache.set(cacheKey, finalScore);

    return finalScore;
}

self.onmessage = function ({ data: { threshold, characters } }) {
    similarityCache.clear();
    cleanAndTokenizeTextCache.clear();

    const totalRuns = characters.length * (characters.length - 1);

    let run = 0;
    let percent = 0;

    const clusters = cluster(characters, (x, y) => {
        const newPercent = Math.round((run++ / totalRuns) * 100);

        if (newPercent !== percent) {
            percent = newPercent;
            self.postMessage({ type: 'progress', data: { percent: newPercent, run, totalRuns } });
        }

        return similarity(x, y);
    });

    const groups = clusters.similarGroups(threshold);

    self.postMessage({ type: 'result', data: groups });
};
