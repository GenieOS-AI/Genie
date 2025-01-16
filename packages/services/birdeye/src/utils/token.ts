export const extractSymbols = (
    text: string,
    mode: "strict" | "loose" = "loose"
): string[] => {
    const symbols = new Set<string>();

    // Common patterns for both modes
    const basePatterns = [
        // $SYMBOL format (case insensitive)
        /\$([A-Za-z][A-Za-z0-9]{1,9})\b/g,
    ];

    // Additional patterns for loose mode
    const loosePatterns = [
        // After articles with optional space/dash
        /\b(?:a|an)\s+([A-Z][A-Z0-9]{1,9})(?:\s|\b|-)/g,
        // Standalone uppercase tokens
        /\b([A-Z][A-Z0-9]{1,9})\b/g,
        // Quoted symbols
        /["']([A-Z][A-Z0-9]{1,9})["']/g,
        // Trading pairs
        /\b([A-Z][A-Z0-9]{1,9})[-/](?:USD|USDC|USDT)\b/g,
        // Common prefixes
        /\b(?:buy|sell|trade|swap)\s+([A-Z][A-Z0-9]{1,9})\b/gi,
    ];

    const patterns = mode === "strict" ? basePatterns : [...basePatterns, ...loosePatterns];

    // Process each pattern
    for (const pattern of patterns) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            const symbol = (match[1] || match[0]).toUpperCase();
            symbols.add(symbol);
        }
    }

    return Array.from(symbols);
};
