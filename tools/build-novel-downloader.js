#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(ROOT, 'novelDownloaderVietSub.user.js');
const SRC_DIR = path.join(ROOT, 'src');
const CORE_FILE = path.join(SRC_DIR, 'novelDownloaderVietSub.core.user.js');
const RULES_DIR = path.join(SRC_DIR, 'rules');
const SPECIAL_RULES_DIR = path.join(RULES_DIR, 'special');
const TEMPLATE_RULES_DIR = path.join(RULES_DIR, 'template');
const SPECIAL_MARKER = '@nd-build:rules-special';
const TEMPLATE_MARKER = '@nd-build:rules-template';

function read(file) {
    return fs.readFileSync(file, 'utf8');
}

function write(file, content) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, 'utf8');
}

function previousCodeChar(source, index) {
    for (let i = index - 1; i >= 0; i--) {
        const ch = source[i];
        if (!/\s/.test(ch)) return ch;
    }
    return '';
}

function isRegexStart(source, index) {
    const prev = previousCodeChar(source, index);
    return !prev || /[({[,:;=!?&|+\-*~^<>]/.test(prev);
}

function skipQuoted(source, index, quote) {
    let i = index + 1;
    while (i < source.length) {
        const ch = source[i];
        if (ch === '\\') {
            i += 2;
            continue;
        }
        if (ch === quote) return i;
        i++;
    }
    throw new Error(`Unclosed string at ${index}`);
}

function skipTemplate(source, index) {
    let i = index + 1;
    while (i < source.length) {
        const ch = source[i];
        if (ch === '\\') {
            i += 2;
            continue;
        }
        if (ch === '`') return i;
        i++;
    }
    throw new Error(`Unclosed template literal at ${index}`);
}

function skipLineComment(source, index) {
    const end = source.indexOf('\n', index + 2);
    return end === -1 ? source.length - 1 : end;
}

function skipBlockComment(source, index) {
    const end = source.indexOf('*/', index + 2);
    if (end === -1) throw new Error(`Unclosed block comment at ${index}`);
    return end + 1;
}

function skipRegex(source, index) {
    let i = index + 1;
    let inClass = false;
    while (i < source.length) {
        const ch = source[i];
        if (ch === '\\') {
            i += 2;
            continue;
        }
        if (ch === '[') inClass = true;
        else if (ch === ']') inClass = false;
        else if (ch === '/' && !inClass) {
            while (/[a-z]/i.test(source[i + 1] || '')) i++;
            return i;
        }
        i++;
    }
    throw new Error(`Unclosed regex at ${index}`);
}

function skipIgnorable(source, index) {
    const ch = source[index];
    const next = source[index + 1];
    if (ch === '\'' || ch === '"') return skipQuoted(source, index, ch);
    if (ch === '`') return skipTemplate(source, index);
    if (ch === '/' && next === '/') return skipLineComment(source, index);
    if (ch === '/' && next === '*') return skipBlockComment(source, index);
    if (ch === '/' && isRegexStart(source, index)) return skipRegex(source, index);
    return index;
}

function findMatching(source, openIndex, openChar, closeChar) {
    let depth = 0;
    for (let i = openIndex; i < source.length; i++) {
        const skipped = skipIgnorable(source, i);
        if (skipped !== i) {
            i = skipped;
            continue;
        }
        const ch = source[i];
        if (ch === openChar) depth++;
        else if (ch === closeChar) {
            depth--;
            if (depth === 0) return i;
        }
    }
    throw new Error(`Cannot find matching ${closeChar} for ${openChar} at ${openIndex}`);
}

function extractArray(source, assignmentText) {
    const assignmentIndex = source.indexOf(assignmentText);
    if (assignmentIndex === -1) throw new Error(`Cannot find ${assignmentText}`);
    const openIndex = source.indexOf('[', assignmentIndex);
    if (openIndex === -1) throw new Error(`Cannot find [ for ${assignmentText}`);
    const closeIndex = findMatching(source, openIndex, '[', ']');
    return {
        assignmentIndex,
        openIndex,
        closeIndex,
        body: source.slice(openIndex + 1, closeIndex)
    };
}

function splitTopLevelItems(body) {
    const items = [];
    let start = 0;
    let curly = 0;
    let square = 0;
    let paren = 0;
    for (let i = 0; i < body.length; i++) {
        const skipped = skipIgnorable(body, i);
        if (skipped !== i) {
            i = skipped;
            continue;
        }
        const ch = body[i];
        if (ch === '{') curly++;
        else if (ch === '}') curly--;
        else if (ch === '[') square++;
        else if (ch === ']') square--;
        else if (ch === '(') paren++;
        else if (ch === ')') paren--;
        else if (ch === ',' && curly === 0 && square === 0 && paren === 0) {
            const item = body.slice(start, i);
            if (item.trim()) items.push(item);
            start = i + 1;
        }
    }
    const tail = body.slice(start);
    if (tail.trim()) items.push(tail);
    return items;
}

function decodeJsString(value) {
    try {
        return Function(`"use strict"; return (${value});`)();
    } catch (error) {
        return value.slice(1, -1);
    }
}

function getSiteName(entry) {
    const match = entry.match(/\bsiteName\s*:\s*(['"`])((?:\\.|(?!\1)[\s\S])*)\1/);
    if (!match) return '';
    if (match[1] === '`') return match[2].replace(/\$\{[\s\S]*?\}/g, '').trim();
    return decodeJsString(`${match[1]}${match[2]}${match[1]}`).trim();
}

function getHostSlug(entry) {
    const fullUrl = entry.match(/https?:\/\/([^/\\\s'"`)]+)/);
    if (fullUrl) return slugify(fullUrl[1]);
    const looseUrl = entry.match(/['"`]:\/\/([^/\\\s'"`)]+)/);
    if (looseUrl) return slugify(looseUrl[1]);
    const hostLike = entry.match(/([a-z0-9-]+\.)+[a-z]{2,}/i);
    if (hostLike) return slugify(hostLike[0]);
    return '';
}

function slugify(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/^www\./, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 64);
}

function makeRuleFileName(entry, index, kind) {
    const siteName = getSiteName(entry);
    const slug = getHostSlug(entry) || slugify(siteName) || kind;
    return `${String(index + 1).padStart(4, '0')}-${slug}.rule.js`;
}

function cleanRuleDir(dir) {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
}

function writeRuleFiles(entries, dir, kind) {
    cleanRuleDir(dir);
    entries.forEach((entry, index) => {
        const siteName = getSiteName(entry);
        const file = path.join(dir, makeRuleFileName(entry, index, kind));
        const normalizedEntry = entry.startsWith('\n') ? entry : `\n${entry}`;
        const content = [
            `// @rule-name: ${siteName || `Rule ${index + 1}`}`,
            `// @rule-source: ${kind}`,
            '(',
            `// @rule-begin${normalizedEntry}`,
            '// @rule-end',
            ')',
            ''
        ].join('\n');
        write(file, content);
    });
}

function splitTemplateBody(body) {
    const firstNewline = body.indexOf('\n');
    if (firstNewline === -1) return { inlineComment: '', body };
    const firstLine = body.slice(0, firstNewline);
    if (/^\s*\/\//.test(firstLine)) {
        return {
            inlineComment: firstLine.replace(/\s+$/, ''),
            body: body.slice(firstNewline)
        };
    }
    return { inlineComment: '', body };
}

function makeCore(source, specialBlock, templateBlock, templateInlineComment = '') {
    const withTemplatePlaceholder = source.slice(0, templateBlock.openIndex + 1)
        + templateInlineComment
        + `\n        // ${TEMPLATE_MARKER}\n    `
        + source.slice(templateBlock.closeIndex);
    const adjustedSpecial = extractArray(withTemplatePlaceholder, 'Rule.special = [');
    return withTemplatePlaceholder.slice(0, adjustedSpecial.openIndex + 1)
        + `\n        // ${SPECIAL_MARKER}\n    `
        + withTemplatePlaceholder.slice(adjustedSpecial.closeIndex);
}

function extract(sourceFile = OUTPUT_FILE) {
    const source = read(sourceFile);
    const specialBlock = extractArray(source, 'Rule.special = [');
    const templateBlock = extractArray(source, 'Rule.template = [');
    const specialRules = splitTopLevelItems(specialBlock.body);
    const templateBody = splitTemplateBody(templateBlock.body);
    const templateRules = splitTopLevelItems(templateBody.body);
    if (!specialRules.length) throw new Error('No Rule.special entries found.');
    if (!templateRules.length) throw new Error('No Rule.template entries found.');

    writeRuleFiles(specialRules, SPECIAL_RULES_DIR, 'special');
    writeRuleFiles(templateRules, TEMPLATE_RULES_DIR, 'template');
    write(CORE_FILE, makeCore(source, specialBlock, templateBlock, templateBody.inlineComment));

    return {
        core: path.relative(ROOT, CORE_FILE),
        special: specialRules.length,
        template: templateRules.length
    };
}

function listRuleFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
        .filter(name => name.endsWith('.rule.js'))
        .sort((a, b) => a.localeCompare(b, 'en'))
        .map(name => path.join(dir, name));
}

function stripLeadingMetadata(source) {
    return source
        .replace(/^\uFEFF/, '')
        .replace(/^(?:(?:\/\/ @[^\n]*|[ \t]*)\r?\n)*/, '');
}

function unwrapRuleFile(file) {
    const raw = read(file);
    const beginMarker = '// @rule-begin';
    const endMarker = '// @rule-end';
    const beginIndex = raw.indexOf(beginMarker);
    const endIndex = raw.indexOf(endMarker, beginIndex + beginMarker.length);
    if (beginIndex !== -1 && endIndex !== -1) {
        const beginLineEnd = raw.indexOf('\n', beginIndex);
        if (beginLineEnd === -1 || beginLineEnd > endIndex) {
            throw new Error(`Invalid rule begin marker: ${path.relative(ROOT, file)}`);
        }
        const body = raw.slice(beginLineEnd + 1, endIndex).replace(/\r?\n$/, '');
        return `\n${body}`;
    }

    const source = stripLeadingMetadata(raw);
    const leading = source.match(/^\s*/)[0].length;
    if (source[leading] !== '(') return source.trimEnd();
    const closeIndex = findMatching(source, leading, '(', ')');
    if (source.slice(closeIndex + 1).trim()) {
        throw new Error(`Unexpected content after rule expression: ${path.relative(ROOT, file)}`);
    }
    return source.slice(leading + 1, closeIndex).replace(/\r?\n$/, '');
}

function buildRulesBody(dir) {
    const entries = listRuleFiles(dir).map(unwrapRuleFile);
    if (!entries.length) throw new Error(`No rule files found in ${path.relative(ROOT, dir)}`);
    return `${entries.join(',')},\n    `;
}

function replaceMarker(source, marker, body) {
    const pattern = new RegExp(`\\n[ \\t]*// ${marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n[ \\t]*`);
    if (!pattern.test(source)) throw new Error(`Cannot find build marker ${marker}`);
    return source.replace(pattern, () => body);
}

function build() {
    let source = read(CORE_FILE);
    source = replaceMarker(source, SPECIAL_MARKER, buildRulesBody(SPECIAL_RULES_DIR));
    source = replaceMarker(source, TEMPLATE_MARKER, buildRulesBody(TEMPLATE_RULES_DIR));
    write(OUTPUT_FILE, source);
    return {
        output: path.relative(ROOT, OUTPUT_FILE),
        special: listRuleFiles(SPECIAL_RULES_DIR).length,
        template: listRuleFiles(TEMPLATE_RULES_DIR).length
    };
}

function usage() {
    console.log([
        'Usage:',
        '  node tools/build-novel-downloader.js build',
        '  node tools/build-novel-downloader.js extract [userscript-file]',
        '',
        'Default command is build.'
    ].join('\n'));
}

function main() {
    const command = process.argv[2] || 'build';
    if (command === '-h' || command === '--help') {
        usage();
        return;
    }
    if (command === 'extract') {
        const result = extract(process.argv[3] ? path.resolve(process.argv[3]) : OUTPUT_FILE);
        console.log(`[nd-build] Extracted ${result.special} special rules and ${result.template} template rules to ${result.core}.`);
        return;
    }
    if (command === 'build') {
        const result = build();
        console.log(`[nd-build] Built ${result.output} from ${result.special} special rules and ${result.template} template rules.`);
        return;
    }
    throw new Error(`Unknown command: ${command}`);
}

main();
