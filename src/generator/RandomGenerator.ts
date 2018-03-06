export default interface RandomGenerator {
    next(): [number, RandomGenerator]
    min(): number //inclusive
    max(): number //inclusive
}

function generateN(rng: RandomGenerator, num: number): [number[], RandomGenerator] {
    let cur: RandomGenerator = rng;
    const out: number[] = [];
    for (let idx = 0 ; idx != num ; ++idx) {
        const [value, next] = cur.next();
        out.push(value);
        cur = next;
    }
    return [out, cur];
}

function skipN(rng: RandomGenerator, num: number): RandomGenerator {
    return generateN(rng, num)[1];
}

export { RandomGenerator, generateN, skipN };
