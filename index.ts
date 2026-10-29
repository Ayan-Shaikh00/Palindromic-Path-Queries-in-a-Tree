function palindromePath(
    n: number,
    edges: number[][],
    s: string,
    queries: string[]
): boolean[] {
    const adj: number[][] = Array.from({ length: n }, () => []);

    for (const [u, v] of edges) {
        adj[u].push(v);
        adj[v].push(u);
    }

    const parent = new Int32Array(n);
    const depth = new Int32Array(n);
    const tin = new Int32Array(n);
    const tout = new Int32Array(n);
    const masks = new Int32Array(n);
    const bit = new Int32Array(n + 2);
    const chars = s.split("");

    parent.fill(-1);

    let timer = 0;
    const LOG = Math.ceil(Math.log2(n + 1));

    const up: Int32Array[] = Array.from(
        { length: LOG },
        () => new Int32Array(n)
    );

    // Iterative DFS: Euler Tour
    const stack: [number, number, boolean][] = [[0, -1, false]];

    while (stack.length > 0) {
        const [u, p, exit] = stack.pop()!;

        if (exit) {
            tout[u] = timer;
            continue;
        }

        parent[u] = p;
        tin[u] = ++timer;
        masks[u] = 1 << (chars[u].charCodeAt(0) - 97);

        stack.push([u, p, true]);

        for (const v of adj[u]) {
            if (v === p) continue;

            depth[v] = depth[u] + 1;
            stack.push([v, u, false]);
        }
    }

    // Binary lifting table
    for (let k = 0; k < LOG; k++) {
        for (let u = 0; u < n; u++) {
            up[k][u] =
                k === 0
                    ? (parent[u] === -1 ? u : parent[u])
                    : up[k - 1][up[k - 1][u]];
        }
    }

    // Fenwick Tree using XOR
    function add(index: number, value: number): void {
        for (let i = index; i <= n; i += i & -i) {
            bit[i] ^= value;
        }
    }

    function prefix(index: number): number {
        let result = 0;

        for (let i = index; i > 0; i -= i & -i) {
            result ^= bit[i];
        }

        return result;
    }

    // Initialize subtree range updates
    for (let u = 0; u < n; u++) {
        add(tin[u], masks[u]);
        add(tout[u] + 1, masks[u]);
    }

    // Lowest Common Ancestor
    function lca(a: number, b: number): number {
        if (depth[a] < depth[b]) {
            [a, b] = [b, a];
        }

        let diff = depth[a] - depth[b];

        for (let k = 0; k < LOG; k++) {
            if ((diff >> k) & 1) {
                a = up[k][a];
            }
        }

        if (a === b) return a;

        for (let k = LOG - 1; k >= 0; k--) {
            if (up[k][a] !== up[k][b]) {
                a = up[k][a];
                b = up[k][b];
            }
        }

        return parent[a];
    }

    // Character parity mask along a path
    function pathMask(u: number, v: number): number {
        const w = lca(u, v);

        return prefix(tin[u]) ^ prefix(tin[v]) ^ masks[w];
    }

    const answer: boolean[] = [];

    for (const query of queries) {
        const parts = query.split(" ");

        if (parts[0] === "update") {
            const u = Number(parts[1]);
            const c = parts[2];

            const newMask = 1 << (c.charCodeAt(0) - 97);
            const delta = masks[u] ^ newMask;

            if (delta !== 0) {
                add(tin[u], delta);
                add(tout[u] + 1, delta);

                masks[u] = newMask;
                chars[u] = c;
            }
        } else {
            const u = Number(parts[1]);
            const v = Number(parts[2]);

            const mask = pathMask(u, v);

            answer.push((mask & (mask - 1)) === 0);
        }
    }

    return answer;
}
