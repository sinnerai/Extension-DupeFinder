/* eslint-disable no-restricted-globals */
import cluster from 'set-clustering';

const allowedKeys = new Set([
    'description',
    'scenario',
    'personality',
    'first_mes',
    'mes_example',
]);

const memoize = (fn) => {
    const cache = new Map();

    return (text, cacheKey) => {
        const key = cacheKey;

        if (cache.has(key)) {
            return cache.get(key);
        }

        const result = fn(text, cacheKey);

        cache.set(key, result);

        return result;
    };
};

const tokenizeIntoSentences = memoize((text, cacheKey) => {
    return text.split(/\.|\?|!/).map(sentence => sentence.trim()).filter(sentence => sentence.length > 0);
});

const buildCacheKey = (name, field, dateAdded) => {
    return `${name}-${field}-${dateAdded}`;
}

function similarity(x, y) {
    let score = 0;
    let matchedKeys = 0;

    for (const key of allowedKeys) {
        const value1 = x.data[key] || '';
        const value2 = y.data[key] || '';

        if (value1 === '' || value2 === '') {
            continue;
        }

        const cacheKey1 = buildCacheKey(x.data['name'], value1, x['date_added']);
        const cacheKey2 = buildCacheKey(y.data['name'], value2, y['date_added']);

        const sentences1 = new Set(tokenizeIntoSentences(value1, cacheKey1));
        const sentences2 = new Set(tokenizeIntoSentences(value2, cacheKey2));

        const intersection = new Set([...sentences1].filter(s => sentences2.has(s)));
        const totalUniqueSentences = new Set([...sentences1, ...sentences2]);

        if (totalUniqueSentences.size > 0) {
            let similarity = intersection.size / totalUniqueSentences.size;
            score += similarity;
            matchedKeys++;
        }
    }

    if (matchedKeys === 0) {
        return 0;
    }

    return score / matchedKeys;
}

self.onmessage = function ({ data: { threshold, characters } }) {
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
