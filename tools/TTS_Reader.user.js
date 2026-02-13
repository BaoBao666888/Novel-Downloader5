// ==UserScript==
// @name         TTS Reader
// @namespace    TTSReader
// @version      1.3.2_beta
// @description  Đọc tiêu đề + nội dung chương bằng TTS, tô màu tiến độ, tự qua chương.
// @author       QuocBao
// @downloadURL  https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/tools/TTS_Reader.user.js
// @updateURL    https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/tools/TTS_Reader.user.js
// @match        https://truyenwikidich.net/truyen/*/*
// @match        https://koanchay.org/truyen/*/*
// @match        https://www.tiktok.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_cookie
// @connect      api16-normal-c-useast1a.tiktokv.com
// @connect      translate.google.com
// @connect      www.bing.com
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY = 'twd_tts_reader_settings_v1';
    const SESSION_KEY = 'twd_tts_reader_session_v1';
    const AUTO_START_WINDOW_MS = 10 * 60 * 1000;
    const TIKTOK_API_ENDPOINT = 'https://api16-normal-c-useast1a.tiktokv.com/media/api/text/speech/invoke/';
    const TIKTOK_USER_AGENT = 'com.zhiliaoapp.musically/2022600030 (Linux; U; Android 7.1.2; es_ES; SM-G988N; Build/NRD90M;tt-ok/3.12.13.1)';
    const TIKTOK_DEFAULT_TIMEOUT_MS = 20000;
    const TIKTOK_DEFAULT_RETRIES = 2;
    const TIKTOK_MIN_REQUEST_GAP_MS = 220;
    const TIKTOK_PREFETCH_DELAY_MS = 450;
    const TIKTOK_RETRY_BASE_DELAY_MS = 650;
    const TIKTOK_MAX_CACHE_ITEMS = 18;
    const GOOGLE_API_ENDPOINT = 'https://translate.google.com/_/TranslateWebserverUi/data/batchexecute';
    const GOOGLE_DEFAULT_TIMEOUT_MS = 18000;
    const GOOGLE_DEFAULT_RETRIES = 2;
    const GOOGLE_MIN_REQUEST_GAP_MS = 120;
    const BING_TRANSLATOR_URL = 'https://www.bing.com/translator';
    const BING_TTS_ENDPOINT = 'https://www.bing.com/tfettts';
    const BING_DEFAULT_TIMEOUT_MS = 22000;
    const BING_DEFAULT_RETRIES = 2;
    const BING_MIN_REQUEST_GAP_MS = 180;
    const SUPPORTS_UNICODE_PROP_ESCAPES = (() => {
        try {

            new RegExp('\\p{L}', 'u');
            return true;
        } catch (err) {
            return false;
        }
    })();
    const SPLIT_NEAR_WINDOW = 80;
    const BREAK_CHARS_STRONG = new Set(Array.from('.!?;:…。！？；：)）]】}』」》"”’'));
    const BREAK_CHARS_COMMA = new Set(Array.from(',，、'));
    const TIKTOK_VOICES = [
        { id: 'vi_female_huong', language: 'vi', name: 'VN - Giọng nữ phổ thông' },
        { id: 'BV074_streaming', language: 'vi', name: 'VN - Cô gái hoạt ngôn' },
        { id: 'BV075_streaming', language: 'vi', name: 'VN - Thanh niên tự tin' },
        { id: 'BV421_vivn_streaming', language: 'vi', name: 'VN - Ngọt ngào' },
        { id: 'BV560_streaming', language: 'vi', name: 'VN - Anh Dũng' },
        { id: 'BV562_streaming', language: 'vi', name: 'VN - Chí Mai' },
        { id: 'en_us_002', language: 'en', name: 'EN - Jessie' },
        { id: 'en_us_006', language: 'en', name: 'EN - Joey' },
        { id: 'en_us_007', language: 'en', name: 'EN - Professor' },
        { id: 'en_us_009', language: 'en', name: 'EN - Scientist' },
        { id: 'en_us_010', language: 'en', name: 'EN - Confidence' },
        { id: 'en_uk_001', language: 'en', name: 'EN - Narrator UK' },
        { id: 'en_uk_003', language: 'en', name: 'EN - Male UK' },
        { id: 'en_au_001', language: 'en', name: 'EN - Metro AU' },
        { id: 'en_male_narration', language: 'en', name: 'EN - Story Teller' },
        { id: 'en_male_funny', language: 'en', name: 'EN - Wacky' },
        { id: 'en_female_samc', language: 'en', name: 'EN - Empathetic' },
        { id: 'en_us_ghostface', language: 'en', name: 'EN - Ghost Face' },
        { id: 'en_us_stitch', language: 'en', name: 'EN - Stitch' },
        { id: 'en_us_rocket', language: 'en', name: 'EN - Rocket' },
        { id: 'fr_001', language: 'fr', name: 'FR - Male 1' },
        { id: 'fr_002', language: 'fr', name: 'FR - Male 2' },
        { id: 'es_002', language: 'es', name: 'ES - Spain Male' },
        { id: 'es_mx_002', language: 'es', name: 'ES - MX Male' },
        { id: 'de_001', language: 'de', name: 'DE - Female' },
        { id: 'de_002', language: 'de', name: 'DE - Male' },
        { id: 'id_001', language: 'id', name: 'ID - Female' },
        { id: 'jp_001', language: 'ja', name: 'JP - Female 1' },
        { id: 'jp_006', language: 'ja', name: 'JP - Male' },
        { id: 'kr_002', language: 'kr', name: 'KR - Male 1' },
        { id: 'kr_003', language: 'kr', name: 'KR - Female' },
        { id: 'br_001', language: 'br', name: 'BR - Female 1' }
    ];

    // Google Translate TTS (vBook plugin): chọn ngôn ngữ, không phân biệt nam/nữ.
    const GOOGLE_VOICES = [
        { id: 'vi-VN', language: 'vi', name: 'VI - Việt Nam' },
        { id: 'en-US', language: 'en', name: 'EN - United States' },
        { id: 'en-GB', language: 'en', name: 'EN - United Kingdom' },
        { id: 'fr-FR', language: 'fr', name: 'FR - France' },
        { id: 'de-DE', language: 'de', name: 'DE - Germany' },
        { id: 'es-ES', language: 'es', name: 'ES - Spain' },
        { id: 'es-MX', language: 'es', name: 'ES - Mexico' },
        { id: 'it-IT', language: 'it', name: 'IT - Italy' },
        { id: 'ru-RU', language: 'ru', name: 'RU - Russia' },
        { id: 'ja-JP', language: 'ja', name: 'JA - Japan' },
        { id: 'ko-KR', language: 'ko', name: 'KO - Korea' },
        { id: 'cmn-Hant-TW', language: 'cmn', name: 'ZH - Traditional (TW)' },
        { id: 'id-ID', language: 'id', name: 'ID - Indonesia' },
        { id: 'th-TH', language: 'th', name: 'TH - Thailand' },
        { id: 'tr-TR', language: 'tr', name: 'TR - Turkey' },
        { id: 'uk-UA', language: 'uk', name: 'UK - Ukraine' },
        { id: 'pt-BR', language: 'pt', name: 'PT - Brazil' },
        { id: 'nl-NL', language: 'nl', name: 'NL - Netherlands' },
        { id: 'sv-SE', language: 'sv', name: 'SV - Sweden' },
        { id: 'pl-PL', language: 'pl', name: 'PL - Poland' },
        { id: 'hi-IN', language: 'hi', name: 'HI - India' }
    ];

    const BING_VOICES = [{ "id": "vi-VN-HoaiMyNeural;Female", "language": "vi-VN", "name": "vi-VN-HoaiMy (Female)" }, { "id": "vi-VN-NamMinhNeural;Male", "language": "vi-VN", "name": "vi-VN-NamMinh (Male)" }, { "id": "ar-EG-Hoda;Female", "language": "ar-EG", "name": "ar-EG-Hoda (Female)" }, { "id": "ar-EG-SalmaNeural;Female", "language": "ar-EG", "name": "ar-EG-Salma (Female)" }, { "id": "ar-EG-ShakirNeural;Male", "language": "ar-EG", "name": "ar-EG-Shakir (Male)" }, { "id": "ar-SA-Naayf;Male", "language": "ar-SA", "name": "ar-SA-Naayf (Male)" }, { "id": "ar-SA-ZariyahNeural;Female", "language": "ar-SA", "name": "ar-SA-Zariyah (Female)" }, { "id": "ar-SA-HamedNeural;Male", "language": "ar-SA", "name": "ar-SA-Hamed (Male)" }, { "id": "bg-BG-Ivan;Male", "language": "bg-BG", "name": "bg-BG-Ivan (Male)" }, { "id": "bg-BG-KalinaNeural;Female", "language": "bg-BG", "name": "bg-BG-Kalina (Female)" }, { "id": "bg-BG-BorislavNeural;Male", "language": "bg-BG", "name": "bg-BG-Borislav (Male)" }, { "id": "ca-ES-HerenaRUS;Female", "language": "ca-ES", "name": "ca-ES-HerenaRUS (Female)" }, { "id": "ca-ES-AlbaNeural;Female", "language": "ca-ES", "name": "ca-ES-Alba (Female)" }, { "id": "ca-ES-JoanaNeural;Female", "language": "ca-ES", "name": "ca-ES-Joana (Female)" }, { "id": "ca-ES-EnricNeural;Male", "language": "ca-ES", "name": "ca-ES-Enric (Male)" }, { "id": "zh-HK-Danny;Male", "language": "zh-HK", "name": "zh-HK-Danny (Male)" }, { "id": "zh-HK-TracyRUS;Female", "language": "zh-HK", "name": "zh-HK-TracyRUS (Female)" }, { "id": "zh-HK-HiuGaaiNeural;Female", "language": "zh-HK", "name": "zh-HK-HiuGaai (Female)" }, { "id": "zh-HK-HiuMaanNeural;Female", "language": "zh-HK", "name": "zh-HK-HiuMaan (Female)" }, { "id": "zh-HK-WanLungNeural;Male", "language": "zh-HK", "name": "zh-HK-WanLung (Male)" }, { "id": "zh-CN-HuihuiRUS;Female", "language": "zh-CN", "name": "zh-CN-HuihuiRUS (Female)" }, { "id": "zh-CN-Kangkang;Male", "language": "zh-CN", "name": "zh-CN-Kangkang (Male)" }, { "id": "zh-CN-Yaoyao;Female", "language": "zh-CN", "name": "zh-CN-Yaoyao (Female)" }, { "id": "zh-CN-XiaoxiaoNeural;Female", "language": "zh-CN", "name": "zh-CN-Xiaoxiao (Female)" }, { "id": "zh-CN-XiaomoNeural;Female", "language": "zh-CN", "name": "zh-CN-Xiaomo (Female)" }, { "id": "zh-CN-XiaoxuanNeural;Female", "language": "zh-CN", "name": "zh-CN-Xiaoxuan (Female)" }, { "id": "zh-CN-XiaohanNeural;Female", "language": "zh-CN", "name": "zh-CN-Xiaohan (Female)" }, { "id": "zh-CN-YunxiNeural;Male", "language": "zh-CN", "name": "zh-CN-Yunxi (Male)" }, { "id": "zh-TW-HanHanRUS;Female", "language": "zh-TW", "name": "zh-TW-HanHanRUS (Female)" }, { "id": "zh-TW-Yating;Female", "language": "zh-TW", "name": "zh-TW-Yating (Female)" }, { "id": "zh-TW-Zhiwei;Male", "language": "zh-TW", "name": "zh-TW-Zhiwei (Male)" }, { "id": "zh-TW-HsiaoChenNeural;Female", "language": "zh-TW", "name": "zh-TW-HsiaoChen (Female)" }, { "id": "zh-TW-HsiaoYuNeural;Female", "language": "zh-TW", "name": "zh-TW-HsiaoYu (Female)" }, { "id": "zh-TW-YunJheNeural;Male", "language": "zh-TW", "name": "zh-TW-YunJhe (Male)" }, { "id": "hr-HR-Matej;Male", "language": "hr-HR", "name": "hr-HR-Matej (Male)" }, { "id": "hr-HR-GabrijelaNeural;Female", "language": "hr-HR", "name": "hr-HR-Gabrijela (Female)" }, { "id": "hr-HR-SreckoNeural;Male", "language": "hr-HR", "name": "hr-HR-Srecko (Male)" }, { "id": "cs-CZ-Jakub;Male", "language": "cs-CZ", "name": "cs-CZ-Jakub (Male)" }, { "id": "cs-CZ-VlastaNeural;Female", "language": "cs-CZ", "name": "cs-CZ-Vlasta (Female)" }, { "id": "cs-CZ-AntoninNeural;Male", "language": "cs-CZ", "name": "cs-CZ-Antonin (Male)" }, { "id": "da-DK-HelleRUS;Female", "language": "da-DK", "name": "da-DK-HelleRUS (Female)" }, { "id": "da-DK-ChristelNeural;Female", "language": "da-DK", "name": "da-DK-Christel (Female)" }, { "id": "da-DK-JeppeNeural;Male", "language": "da-DK", "name": "da-DK-Jeppe (Male)" }, { "id": "nl-NL-HannaRUS;Female", "language": "nl-NL", "name": "nl-NL-HannaRUS (Female)" }, { "id": "nl-NL-ColetteNeural;Female", "language": "nl-NL", "name": "nl-NL-Colette (Female)" }, { "id": "nl-NL-FennaNeural;Female", "language": "nl-NL", "name": "nl-NL-Fenna (Female)" }, { "id": "nl-NL-MaartenNeural;Male", "language": "nl-NL", "name": "nl-NL-Maarten (Male)" }, { "id": "en-AU-Catherine;Female", "language": "en-AU", "name": "en-AU-Catherine (Female)" }, { "id": "en-AU-HayleyRUS;Female", "language": "en-AU", "name": "en-AU-HayleyRUS (Female)" }, { "id": "en-AU-NatashaNeural;Female", "language": "en-AU", "name": "en-AU-Natasha (Female)" }, { "id": "en-AU-WilliamNeural;Male", "language": "en-AU", "name": "en-AU-William (Male)" }, { "id": "en-CA-HeatherRUS;Female", "language": "en-CA", "name": "en-CA-HeatherRUS (Female)" }, { "id": "en-CA-Linda;Female", "language": "en-CA", "name": "en-CA-Linda (Female)" }, { "id": "en-CA-ClaraNeural;Female", "language": "en-CA", "name": "en-CA-Clara (Female)" }, { "id": "en-CA-LiamNeural;Male", "language": "en-CA", "name": "en-CA-Liam (Male)" }, { "id": "en-IN-Heera;Female", "language": "en-IN", "name": "en-IN-Heera (Female)" }, { "id": "en-IN-PriyaRUS;Female", "language": "en-IN", "name": "en-IN-PriyaRUS (Female)" }, { "id": "en-IN-Ravi;Male", "language": "en-IN", "name": "en-IN-Ravi (Male)" }, { "id": "en-IN-NeerjaNeural;Female", "language": "en-IN", "name": "en-IN-Neerja (Female)" }, { "id": "en-IN-PrabhatNeural;Male", "language": "en-IN", "name": "en-IN-Prabhat (Male)" }, { "id": "en-IE-Sean;Male", "language": "en-IE", "name": "en-IE-Sean (Male)" }, { "id": "en-IE-EmilyNeural;Female", "language": "en-IE", "name": "en-IE-Emily (Female)" }, { "id": "en-IE-ConnorNeural;Male", "language": "en-IE", "name": "en-IE-Connor (Male)" }, { "id": "en-GB-George;Male", "language": "en-GB", "name": "en-GB-George (Male)" }, { "id": "en-GB-HazelRUS;Female", "language": "en-GB", "name": "en-GB-HazelRUS (Female)" }, { "id": "en-GB-Susan;Female", "language": "en-GB", "name": "en-GB-Susan (Female)" }, { "id": "en-GB-LibbyNeural;Female", "language": "en-GB", "name": "en-GB-Libby (Female)" }, { "id": "en-GB-MiaNeural;Female", "language": "en-GB", "name": "en-GB-Mia (Female)" }, { "id": "en-GB-RyanNeural;Male", "language": "en-GB", "name": "en-GB-Ryan (Male)" }, { "id": "en-US-BenjaminRUS;Male", "language": "en-US", "name": "en-US-BenjaminRUS (Male)" }, { "id": "en-US-GuyRUS;Male", "language": "en-US", "name": "en-US-GuyRUS (Male)" }, { "id": "en-US-AriaRUS;Female", "language": "en-US", "name": "en-US-AriaRUS (Female)" }, { "id": "en-US-ZiraRUS;Female", "language": "en-US", "name": "en-US-ZiraRUS (Female)" }, { "id": "en-US-AriaNeural;Female", "language": "en-US", "name": "en-US-Aria (Female)" }, { "id": "en-US-JennyNeural;Female", "language": "en-US", "name": "en-US-Jenny (Female)" }, { "id": "en-US-GuyNeural;Male", "language": "en-US", "name": "en-US-Guy (Male)" }, { "id": "fi-FI-HeidiRUS;Female", "language": "fi-FI", "name": "fi-FI-HeidiRUS (Female)" }, { "id": "fi-FI-NooraNeural;Female", "language": "fi-FI", "name": "fi-FI-Noora (Female)" }, { "id": "fi-FI-SelmaNeural;Female", "language": "fi-FI", "name": "fi-FI-Selma (Female)" }, { "id": "fi-FI-HarriNeural;Male", "language": "fi-FI", "name": "fi-FI-Harri (Male)" }, { "id": "fr-CA-Caroline;Female", "language": "fr-CA", "name": "fr-CA-Caroline (Female)" }, { "id": "fr-CA-HarmonieRUS;Female", "language": "fr-CA", "name": "fr-CA-HarmonieRUS (Female)" }, { "id": "fr-CA-SylvieNeural;Female", "language": "fr-CA", "name": "fr-CA-Sylvie (Female)" }, { "id": "fr-CA-AntoineNeural;Male", "language": "fr-CA", "name": "fr-CA-Antoine (Male)" }, { "id": "fr-CA-JeanNeural;Male", "language": "fr-CA", "name": "fr-CA-Jean (Male)" }, { "id": "fr-FR-HortenseRUS;Female", "language": "fr-FR", "name": "fr-FR-HortenseRUS (Female)" }, { "id": "fr-FR-Julie;Female", "language": "fr-FR", "name": "fr-FR-Julie (Female)" }, { "id": "fr-FR-Paul;Male", "language": "fr-FR", "name": "fr-FR-Paul (Male)" }, { "id": "fr-FR-DeniseNeural;Female", "language": "fr-FR", "name": "fr-FR-Denise (Female)" }, { "id": "fr-FR-HenriNeural;Male", "language": "fr-FR", "name": "fr-FR-Henri (Male)" }, { "id": "fr-CH-Guillaume;Male", "language": "fr-CH", "name": "fr-CH-Guillaume (Male)" }, { "id": "fr-CH-ArianeNeural;Female", "language": "fr-CH", "name": "fr-CH-Ariane (Female)" }, { "id": "fr-CH-FabriceNeural;Male", "language": "fr-CH", "name": "fr-CH-Fabrice (Male)" }, { "id": "de-AT-Michael;Male", "language": "de-AT", "name": "de-AT-Michael (Male)" }, { "id": "de-AT-IngridNeural;Female", "language": "de-AT", "name": "de-AT-Ingrid (Female)" }, { "id": "de-AT-JonasNeural;Male", "language": "de-AT", "name": "de-AT-Jonas (Male)" }, { "id": "de-DE-HeddaRUS;Female", "language": "de-DE", "name": "de-DE-HeddaRUS (Female)" }, { "id": "de-DE-Stefan;Male", "language": "de-DE", "name": "de-DE-Stefan (Male)" }, { "id": "de-DE-KatjaNeural;Female", "language": "de-DE", "name": "de-DE-Katja (Female)" }, { "id": "de-DE-ConradNeural;Male", "language": "de-DE", "name": "de-DE-Conrad (Male)" }, { "id": "de-CH-Karsten;Male", "language": "de-CH", "name": "de-CH-Karsten (Male)" }, { "id": "de-CH-LeniNeural;Female", "language": "de-CH", "name": "de-CH-Leni (Female)" }, { "id": "de-CH-JanNeural;Male", "language": "de-CH", "name": "de-CH-Jan (Male)" }, { "id": "el-GR-Stefanos;Male", "language": "el-GR", "name": "el-GR-Stefanos (Male)" }, { "id": "el-GR-AthinaNeural;Female", "language": "el-GR", "name": "el-GR-Athina (Female)" }, { "id": "el-GR-NestorasNeural;Male", "language": "el-GR", "name": "el-GR-Nestoras (Male)" }, { "id": "he-IL-Asaf;Male", "language": "he-IL", "name": "he-IL-Asaf (Male)" }, { "id": "he-IL-HilaNeural;Female", "language": "he-IL", "name": "he-IL-Hila (Female)" }, { "id": "he-IL-AvriNeural;Male", "language": "he-IL", "name": "he-IL-Avri (Male)" }, { "id": "hi-IN-Hemant;Male", "language": "hi-IN", "name": "hi-IN-Hemant (Male)" }, { "id": "hi-IN-Kalpana;Female", "language": "hi-IN", "name": "hi-IN-Kalpana (Female)" }, { "id": "hi-IN-SwaraNeural;Female", "language": "hi-IN", "name": "hi-IN-Swara (Female)" }, { "id": "hi-IN-MadhurNeural;Male", "language": "hi-IN", "name": "hi-IN-Madhur (Male)" }, { "id": "hu-HU-Szabolcs;Male", "language": "hu-HU", "name": "hu-HU-Szabolcs (Male)" }, { "id": "hu-HU-NoemiNeural;Female", "language": "hu-HU", "name": "hu-HU-Noemi (Female)" }, { "id": "hu-HU-TamasNeural;Male", "language": "hu-HU", "name": "hu-HU-Tamas (Male)" }, { "id": "id-ID-Andika;Male", "language": "id-ID", "name": "id-ID-Andika (Male)" }, { "id": "id-ID-GadisNeural;Female", "language": "id-ID", "name": "id-ID-Gadis (Female)" }, { "id": "id-ID-ArdiNeural;Male", "language": "id-ID", "name": "id-ID-Ardi (Male)" }, { "id": "it-IT-Cosimo;Male", "language": "it-IT", "name": "it-IT-Cosimo (Male)" }, { "id": "it-IT-LuciaRUS;Female", "language": "it-IT", "name": "it-IT-LuciaRUS (Female)" }, { "id": "it-IT-ElsaNeural;Female", "language": "it-IT", "name": "it-IT-Elsa (Female)" }, { "id": "it-IT-IsabellaNeural;Female", "language": "it-IT", "name": "it-IT-Isabella (Female)" }, { "id": "it-IT-DiegoNeural;Male", "language": "it-IT", "name": "it-IT-Diego (Male)" }, { "id": "ja-JP-Ayumi;Female", "language": "ja-JP", "name": "ja-JP-Ayumi (Female)" }, { "id": "ja-JP-HarukaRUS;Female", "language": "ja-JP", "name": "ja-JP-HarukaRUS (Female)" }, { "id": "ja-JP-Ichiro;Male", "language": "ja-JP", "name": "ja-JP-Ichiro (Male)" }, { "id": "ja-JP-NanamiNeural;Female", "language": "ja-JP", "name": "ja-JP-Nanami (Female)" }, { "id": "ja-JP-KeitaNeural;Male", "language": "ja-JP", "name": "ja-JP-Keita (Male)" }, { "id": "ko-KR-HeamiRUS;Female", "language": "ko-KR", "name": "ko-KR-HeamiRUS (Female)" }, { "id": "ko-KR-SunHiNeural;Female", "language": "ko-KR", "name": "ko-KR-SunHi (Female)" }, { "id": "ko-KR-InJoonNeural;Male", "language": "ko-KR", "name": "ko-KR-InJoon (Male)" }, { "id": "ms-MY-Rizwan;Male", "language": "ms-MY", "name": "ms-MY-Rizwan (Male)" }, { "id": "ms-MY-YasminNeural;Female", "language": "ms-MY", "name": "ms-MY-Yasmin (Female)" }, { "id": "ms-MY-OsmanNeural;Male", "language": "ms-MY", "name": "ms-MY-Osman (Male)" }, { "id": "nb-NO-HuldaRUS;Female", "language": "nb-NO", "name": "nb-NO-HuldaRUS (Female)" }, { "id": "nb-NO-IselinNeural;Female", "language": "nb-NO", "name": "nb-NO-Iselin (Female)" }, { "id": "nb-NO-PernilleNeural;Female", "language": "nb-NO", "name": "nb-NO-Pernille (Female)" }, { "id": "nb-NO-FinnNeural;Male", "language": "nb-NO", "name": "nb-NO-Finn (Male)" }, { "id": "pl-PL-PaulinaRUS;Female", "language": "pl-PL", "name": "pl-PL-PaulinaRUS (Female)" }, { "id": "pl-PL-AgnieszkaNeural;Female", "language": "pl-PL", "name": "pl-PL-Agnieszka (Female)" }, { "id": "pl-PL-ZofiaNeural;Female", "language": "pl-PL", "name": "pl-PL-Zofia (Female)" }, { "id": "pl-PL-MarekNeural;Male", "language": "pl-PL", "name": "pl-PL-Marek (Male)" }, { "id": "pt-BR-Daniel;Male", "language": "pt-BR", "name": "pt-BR-Daniel (Male)" }, { "id": "pt-BR-HeloisaRUS;Female", "language": "pt-BR", "name": "pt-BR-HeloisaRUS (Female)" }, { "id": "pt-BR-FranciscaNeural;Female", "language": "pt-BR", "name": "pt-BR-Francisca (Female)" }, { "id": "pt-BR-AntonioNeural;Male", "language": "pt-BR", "name": "pt-BR-Antonio (Male)" }, { "id": "pt-PT-HeliaRUS;Female", "language": "pt-PT", "name": "pt-PT-HeliaRUS (Female)" }, { "id": "pt-PT-FernandaNeural;Female", "language": "pt-PT", "name": "pt-PT-Fernanda (Female)" }, { "id": "pt-PT-RaquelNeural;Female", "language": "pt-PT", "name": "pt-PT-Raquel (Female)" }, { "id": "pt-PT-DuarteNeural;Male", "language": "pt-PT", "name": "pt-PT-Duarte (Male)" }, { "id": "ro-RO-Andrei;Male", "language": "ro-RO", "name": "ro-RO-Andrei (Male)" }, { "id": "ro-RO-AlinaNeural;Female", "language": "ro-RO", "name": "ro-RO-Alina (Female)" }, { "id": "ro-RO-EmilNeural;Male", "language": "ro-RO", "name": "ro-RO-Emil (Male)" }, { "id": "ru-RU-EkaterinaRUS;Female", "language": "ru-RU", "name": "ru-RU-EkaterinaRUS (Female)" }, { "id": "ru-RU-Irina;Female", "language": "ru-RU", "name": "ru-RU-Irina (Female)" }, { "id": "ru-RU-Pavel;Male", "language": "ru-RU", "name": "ru-RU-Pavel (Male)" }, { "id": "ru-RU-DariyaNeural;Female", "language": "ru-RU", "name": "ru-RU-Dariya (Female)" }, { "id": "ru-RU-SvetlanaNeural;Female", "language": "ru-RU", "name": "ru-RU-Svetlana (Female)" }, { "id": "ru-RU-DmitryNeural;Male", "language": "ru-RU", "name": "ru-RU-Dmitry (Male)" }, { "id": "sk-SK-Filip;Male", "language": "sk-SK", "name": "sk-SK-Filip (Male)" }, { "id": "sk-SK-ViktoriaNeural;Female", "language": "sk-SK", "name": "sk-SK-Viktoria (Female)" }, { "id": "sk-SK-LukasNeural;Male", "language": "sk-SK", "name": "sk-SK-Lukas (Male)" }, { "id": "sl-SI-Lado;Male", "language": "sl-SI", "name": "sl-SI-Lado (Male)" }, { "id": "sl-SI-PetraNeural;Female", "language": "sl-SI", "name": "sl-SI-Petra (Female)" }, { "id": "sl-SI-RokNeural;Male", "language": "sl-SI", "name": "sl-SI-Rok (Male)" }, { "id": "es-MX-HildaRUS;Female", "language": "es-MX", "name": "es-MX-HildaRUS (Female)" }, { "id": "es-MX-Raul;Male", "language": "es-MX", "name": "es-MX-Raul (Male)" }, { "id": "es-MX-DaliaNeural;Female", "language": "es-MX", "name": "es-MX-Dalia (Female)" }, { "id": "es-MX-JorgeNeural;Male", "language": "es-MX", "name": "es-MX-Jorge (Male)" }, { "id": "es-ES-HelenaRUS;Female", "language": "es-ES", "name": "es-ES-HelenaRUS (Female)" }, { "id": "es-ES-Laura;Female", "language": "es-ES", "name": "es-ES-Laura (Female)" }, { "id": "es-ES-Pablo;Male", "language": "es-ES", "name": "es-ES-Pablo (Male)" }, { "id": "es-ES-ElviraNeural;Female", "language": "es-ES", "name": "es-ES-Elvira (Female)" }, { "id": "es-ES-AlvaroNeural;Male", "language": "es-ES", "name": "es-ES-Alvaro (Male)" }, { "id": "sv-SE-HedvigRUS;Female", "language": "sv-SE", "name": "sv-SE-HedvigRUS (Female)" }, { "id": "sv-SE-HilleviNeural;Female", "language": "sv-SE", "name": "sv-SE-Hillevi (Female)" }, { "id": "sv-SE-SofieNeural;Female", "language": "sv-SE", "name": "sv-SE-Sofie (Female)" }, { "id": "sv-SE-MattiasNeural;Male", "language": "sv-SE", "name": "sv-SE-Mattias (Male)" }, { "id": "ta-IN-Valluvar;Male", "language": "ta-IN", "name": "ta-IN-Valluvar (Male)" }, { "id": "ta-IN-PallaviNeural;Female", "language": "ta-IN", "name": "ta-IN-Pallavi (Female)" }, { "id": "ta-IN-ValluvarNeural;Male", "language": "ta-IN", "name": "ta-IN-Valluvar (Male)" }, { "id": "te-IN-Chitra;Female", "language": "te-IN", "name": "te-IN-Chitra (Female)" }, { "id": "te-IN-ShrutiNeural;Female", "language": "te-IN", "name": "te-IN-Shruti (Female)" }, { "id": "te-IN-MohanNeural;Male", "language": "te-IN", "name": "te-IN-Mohan (Male)" }, { "id": "th-TH-Pattara;Male", "language": "th-TH", "name": "th-TH-Pattara (Male)" }, { "id": "th-TH-AcharaNeural;Female", "language": "th-TH", "name": "th-TH-Achara (Female)" }, { "id": "th-TH-PremwadeeNeural;Female", "language": "th-TH", "name": "th-TH-Premwadee (Female)" }, { "id": "th-TH-NiwatNeural;Male", "language": "th-TH", "name": "th-TH-Niwat (Male)" }, { "id": "tr-TR-SedaRUS;Female", "language": "tr-TR", "name": "tr-TR-SedaRUS (Female)" }, { "id": "tr-TR-EmelNeural;Female", "language": "tr-TR", "name": "tr-TR-Emel (Female)" }, { "id": "tr-TR-AhmetNeural;Male", "language": "tr-TR", "name": "tr-TR-Ahmet (Male)" }, { "id": "nl-BE-DenaNeural;Female", "language": "nl-BE", "name": "nl-BE-Dena (Female)" }, { "id": "nl-BE-ArnaudNeural;Male", "language": "nl-BE", "name": "nl-BE-Arnaud (Male)" }, { "id": "en-HK-YanNeural;Female", "language": "en-HK", "name": "en-HK-Yan (Female)" }, { "id": "en-HK-SamNeural;Male", "language": "en-HK", "name": "en-HK-Sam (Male)" }, { "id": "en-NZ-MollyNeural;Female", "language": "en-NZ", "name": "en-NZ-Molly (Female)" }, { "id": "en-NZ-MitchellNeural;Male", "language": "en-NZ", "name": "en-NZ-Mitchell (Male)" }, { "id": "en-PH-RosaNeural;Female", "language": "en-PH", "name": "en-PH-Rosa (Female)" }, { "id": "en-PH-JamesNeural;Male", "language": "en-PH", "name": "en-PH-James (Male)" }, { "id": "en-SG-LunaNeural;Female", "language": "en-SG", "name": "en-SG-Luna (Female)" }, { "id": "en-SG-WayneNeural;Male", "language": "en-SG", "name": "en-SG-Wayne (Male)" }, { "id": "en-ZA-LeahNeural;Female", "language": "en-ZA", "name": "en-ZA-Leah (Female)" }, { "id": "en-ZA-LukeNeural;Male", "language": "en-ZA", "name": "en-ZA-Luke (Male)" }, { "id": "et-EE-AnuNeural;Female", "language": "et-EE", "name": "et-EE-Anu (Female)" }, { "id": "et-EE-KertNeural;Male", "language": "et-EE", "name": "et-EE-Kert (Male)" }, { "id": "fr-BE-CharlineNeural;Female", "language": "fr-BE", "name": "fr-BE-Charline (Female)" }, { "id": "fr-BE-GerardNeural;Male", "language": "fr-BE", "name": "fr-BE-Gerard (Male)" }, { "id": "gu-IN-DhwaniNeural;Female", "language": "gu-IN", "name": "gu-IN-Dhwani (Female)" }, { "id": "gu-IN-NiranjanNeural;Male", "language": "gu-IN", "name": "gu-IN-Niranjan (Male)" }, { "id": "ga-IE-OrlaNeural;Female", "language": "ga-IE", "name": "ga-IE-Orla (Female)" }, { "id": "ga-IE-ColmNeural;Male", "language": "ga-IE", "name": "ga-IE-Colm (Male)" }, { "id": "lv-LV-EveritaNeural;Female", "language": "lv-LV", "name": "lv-LV-Everita (Female)" }, { "id": "lv-LV-NilsNeural;Male", "language": "lv-LV", "name": "lv-LV-Nils (Male)" }, { "id": "lt-LT-OnaNeural;Female", "language": "lt-LT", "name": "lt-LT-Ona (Female)" }, { "id": "lt-LT-LeonasNeural;Male", "language": "lt-LT", "name": "lt-LT-Leonas (Male)" }, { "id": "mt-MT-GraceNeural;Female", "language": "mt-MT", "name": "mt-MT-Grace (Female)" }, { "id": "mt-MT-JosephNeural;Male", "language": "mt-MT", "name": "mt-MT-Joseph (Male)" }, { "id": "mr-IN-AarohiNeural;Female", "language": "mr-IN", "name": "mr-IN-Aarohi (Female)" }, { "id": "mr-IN-ManoharNeural;Male", "language": "mr-IN", "name": "mr-IN-Manohar (Male)" }, { "id": "es-AR-ElenaNeural;Female", "language": "es-AR", "name": "es-AR-Elena (Female)" }, { "id": "es-AR-TomasNeural;Male", "language": "es-AR", "name": "es-AR-Tomas (Male)" }, { "id": "es-CO-SalomeNeural;Female", "language": "es-CO", "name": "es-CO-Salome (Female)" }, { "id": "es-CO-GonzaloNeural;Male", "language": "es-CO", "name": "es-CO-Gonzalo (Male)" }, { "id": "es-US-PalomaNeural;Female", "language": "es-US", "name": "es-US-Paloma (Female)" }, { "id": "es-US-AlonsoNeural;Male", "language": "es-US", "name": "es-US-Alonso (Male)" }, { "id": "sw-KE-ZuriNeural;Female", "language": "sw-KE", "name": "sw-KE-Zuri (Female)" }, { "id": "sw-KE-RafikiNeural;Male", "language": "sw-KE", "name": "sw-KE-Rafiki (Male)" }, { "id": "uk-UA-PolinaNeural;Female", "language": "uk-UA", "name": "uk-UA-Polina (Female)" }, { "id": "uk-UA-OstapNeural;Male", "language": "uk-UA", "name": "uk-UA-Ostap (Male)" }, { "id": "ur-PK-UzmaNeural;Female", "language": "ur-PK", "name": "ur-PK-Uzma (Female)" }, { "id": "ur-PK-AsadNeural;Male", "language": "ur-PK", "name": "ur-PK-Asad (Male)" }, { "id": "cy-GB-NiaNeural;Female", "language": "cy-GB", "name": "cy-GB-Nia (Female)" }, { "id": "cy-GB-AledNeural;Male", "language": "cy-GB", "name": "cy-GB-Aled (Male)" }];

    const DEFAULT_SETTINGS = {
        provider: 'browser',
        voiceURI: '',
        tiktokVoiceId: 'vi_female_huong',
        googleVoiceId: 'vi-VN',
        bingVoiceId: 'vi-VN-HoaiMyNeural;Female',
        tiktokCookieText: '',
        prefetchEnabled: true,
        prefetchCount: 2,
        remoteTimeoutMs: 20000,
        remoteRetries: 2,
        remoteMinGapMs: 220,
        segmentDelayMs: 250,
        replaceEnabled: false,
        replaceRules: [],
        rate: 1,
        pitch: 1,
        volume: 1,
        maxChars: 260,
        autoNext: true,
        includeTitle: true,
        autoScroll: true,
        autoStartOnNextChapter: true,
        panelCollapsed: false
    };

    const state = {
        settings: loadSettings(),
        title: '',
        nextUrl: '',
        paragraphs: [],
        pickMode: false,
        segments: [],
        segmentIndex: 0,
        reading: false,
        paused: false,
        utteranceToken: 0,
        pendingAutoStart: false,
        currentAudio: null,
        sharedAudio: null,
        silentAudio: null,
        mediaSessionBound: false,
        remoteAudioCache: new Map(),
        remoteAudioInflight: new Map(),
        prefetchJobId: 0,
        tiktokCookieParsedCache: { raw: '', parsed: null },
        bingTokenCache: null,
        nextSegmentTimer: 0,
        gmCookieCapability: 'unknown',
        gmCookieHeader: '',
        uiHost: null,
        ui: null
    };

    const REMOTE_PROVIDERS = {
        tiktok: {
            id: 'tiktok',
            label: 'TikTok',
            voices: TIKTOK_VOICES,
            maxCharsCap: 200,
            defaultTimeoutMs: TIKTOK_DEFAULT_TIMEOUT_MS,
            defaultRetries: TIKTOK_DEFAULT_RETRIES,
            defaultMinGapMs: TIKTOK_MIN_REQUEST_GAP_MS,
            prefetchDelayMs: TIKTOK_PREFETCH_DELAY_MS,
            defaultVoiceId: 'vi_female_huong',
            getVoiceId: () => state.settings.tiktokVoiceId,
            setVoiceId: (voiceId) => {
                state.settings.tiktokVoiceId = String(voiceId || '');
            },
            synthesizeBase64: (text, voiceId, options) => tiktokSynthesizeBase64(text, voiceId, options),
            onAuthRequired: () => {
                if (state.gmCookieCapability === 'full') {
                    detectGMCookieCapability();
                } else {
                    openTikTokCookieModal({ reason: 'auto' });
                }
            }
        },
        google: {
            id: 'google',
            label: 'Google',
            voices: GOOGLE_VOICES,
            maxCharsCap: 200,
            defaultTimeoutMs: GOOGLE_DEFAULT_TIMEOUT_MS,
            defaultRetries: GOOGLE_DEFAULT_RETRIES,
            defaultMinGapMs: GOOGLE_MIN_REQUEST_GAP_MS,
            prefetchDelayMs: TIKTOK_PREFETCH_DELAY_MS,
            defaultVoiceId: 'vi-VN',
            getVoiceId: () => state.settings.googleVoiceId,
            setVoiceId: (voiceId) => {
                state.settings.googleVoiceId = String(voiceId || '');
            },
            synthesizeBase64: (text, voiceId, options) => googleSynthesizeBase64(text, voiceId, options),
            onAuthRequired: () => { }
        },
        bing: {
            id: 'bing',
            label: 'Bing',
            voices: BING_VOICES,
            maxCharsCap: 600,
            defaultTimeoutMs: BING_DEFAULT_TIMEOUT_MS,
            defaultRetries: BING_DEFAULT_RETRIES,
            defaultMinGapMs: BING_MIN_REQUEST_GAP_MS,
            prefetchDelayMs: TIKTOK_PREFETCH_DELAY_MS,
            defaultVoiceId: 'vi-VN-HoaiMyNeural;Female',
            getVoiceId: () => state.settings.bingVoiceId,
            setVoiceId: (voiceId) => {
                state.settings.bingVoiceId = String(voiceId || '');
            },
            synthesizeBase64: (text, voiceId, options) => bingSynthesizeBase64(text, voiceId, options),
            onAuthRequired: () => { }
        }
    };

    boot();

    function boot() {
        if (location.hostname === 'www.tiktok.com') {
            return;
        }
        if (location.hostname !== 'truyenwikidich.net') {
            return;
        }
        waitForContent(25).then((ok) => {
            if (!ok) {
                return;
            }
            state.settings.provider = getProviderId();
            state.pendingAutoStart = consumePendingSession();
            injectStyles();
            buildUi();
            refreshChapterData();
            initVoiceList();
            bindUnloadCancel();
            detectGMCookieCapability();
            bindChapterPartUserRefresh();

            if (state.pendingAutoStart) {
                setTimeout(() => {
                    startFromParagraph(1);
                }, 700);
            }
        });
    }

    function bindChapterPartUserRefresh() {
        document.addEventListener('click', (event) => {
            try {
                if (!event || !event.isTrusted) {
                    return;
                }
                const target = event.target;
                const link = target && target.closest ? target.closest('a.chapter-part[data-action="loadChapterPart"]') : null;
                if (!link) {
                    return;
                }
                const prevSig = getBookContentSignature();
                setTimeout(() => {
                    waitForBookContentChanged(prevSig, 15000).then((ok) => {
                        if (!ok) {
                            return;
                        }
                        stopReading(false);
                        refreshChapterData();
                    });
                }, 0);
            } catch (err) {
            }
        }, true);
    }

    function detectGMCookieCapability() {
        if (typeof GM_cookie === 'undefined' || !GM_cookie || typeof GM_cookie.list !== 'function') {
            state.gmCookieCapability = 'unavailable';
            state.gmCookieHeader = '';
            refreshProviderUi();
            return;
        }

        GM_cookie.list({ url: 'https://www.tiktok.com/' }, (cookies, error) => {
            if (error || !cookies) {
                state.gmCookieCapability = 'unavailable';
                state.gmCookieHeader = '';
                refreshProviderUi();
                return;
            }

            const hasHttpOnly = cookies.some(c => c.httpOnly);
            if (!hasHttpOnly) {
                state.gmCookieCapability = 'no_httponly';
                state.gmCookieHeader = '';
                refreshProviderUi();
                return;
            }

            const headerString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
            const hasSession = hasSessionCookie(headerString);
            if (!hasSession) {
                state.gmCookieCapability = 'no_session';
                state.gmCookieHeader = '';
                refreshProviderUi();
                return;
            }

            state.gmCookieCapability = 'full';
            state.gmCookieHeader = headerString;
            refreshProviderUi();
        });
    }

    function waitForContent(retries) {
        return new Promise((resolve) => {
            let count = 0;
            const timer = setInterval(() => {
                const el = document.querySelector('#bookContentBody');
                if (el && normalizeText(el.innerText).length > 20) {
                    clearInterval(timer);
                    resolve(true);
                    return;
                }
                count += 1;
                if (count >= retries) {
                    clearInterval(timer);
                    resolve(false);
                }
            }, 250);
        });
    }

    function loadSettings() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return { ...DEFAULT_SETTINGS };
            }
            const parsed = JSON.parse(raw);
            const merged = { ...DEFAULT_SETTINGS, ...parsed };

            if (!Object.prototype.hasOwnProperty.call(parsed, 'prefetchEnabled') && typeof parsed.tiktokPrefetch === 'boolean') {
                merged.prefetchEnabled = parsed.tiktokPrefetch;
            }
            if (!Object.prototype.hasOwnProperty.call(parsed, 'prefetchCount') && Number.isFinite(Number(parsed.tiktokPrefetchCount))) {
                merged.prefetchCount = clampInt(parsed.tiktokPrefetchCount, 0, 6);
            }
            if (!Array.isArray(merged.replaceRules)) {
                merged.replaceRules = [];
            }
            merged.replaceEnabled = !!merged.replaceEnabled;
            return merged;
        } catch (err) {
            return { ...DEFAULT_SETTINGS };
        }
    }

    function saveSettings() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings));
    }

    function saveSessionForNextChapter() {
        localStorage.setItem(
            SESSION_KEY,
            JSON.stringify({
                autoStart: true,
                createdAt: Date.now()
            })
        );
    }

    function consumePendingSession() {
        try {
            const raw = localStorage.getItem(SESSION_KEY);
            if (!raw) {
                return false;
            }
            localStorage.removeItem(SESSION_KEY);
            const parsed = JSON.parse(raw);
            if (!parsed || !parsed.autoStart || !parsed.createdAt) {
                return false;
            }
            return Date.now() - parsed.createdAt <= AUTO_START_WINDOW_MS;
        } catch (err) {
            localStorage.removeItem(SESSION_KEY);
            return false;
        }
    }

    function refreshChapterData() {
        state.title = getChapterTitle();
        state.nextUrl = getNextChapterUrl();
        state.paragraphs = getParagraphNodes();
        clearRemoteAudioCache();
        rebuildSegments();
        refreshStartRange();
        resetHighlights();
        if (state.pickMode) {
            mountParagraphPickButtons();
            updateStatus('Đang chọn vị trí đọc');
        } else {
            unmountParagraphPickButtons();
            updateStatus('Sẵn sàng');
        }
        updatePickModeButton();
    }

    function setStartParagraphInput(paragraphNumber) {
        if (!state.ui || !state.ui.startInput) {
            return 1;
        }
        const max = Math.max(1, state.paragraphs.length);
        const safe = clampInt(paragraphNumber, 1, max);
        state.ui.startInput.value = String(safe);
        return safe;
    }

    function updatePickModeButton() {
        if (!state.ui || !state.ui.pickStartBtn) {
            return;
        }
        const btn = state.ui.pickStartBtn;
        btn.classList.toggle('twd-btn-picking', state.pickMode);
        btn.textContent = state.pickMode ? 'Tắt chọn vị trí' : 'Chọn vị trí đọc';
    }

    function unmountParagraphPickButtons() {
        const body = document.querySelector('#bookContentBody');
        if (body) {
            body.classList.remove('twd-tts-pick-mode');
            body.classList.remove('twd-tts-pick-target');
        }
        document.querySelectorAll('#bookContentBody .twd-tts-pick-point').forEach((el) => el.remove());
        document.querySelectorAll('#bookContentBody .twd-tts-pick-target').forEach((el) => {
            el.classList.remove('twd-tts-pick-target');
        });
    }

    function mountParagraphPickButtons() {
        unmountParagraphPickButtons();
        const body = document.querySelector('#bookContentBody');

        state.paragraphs = getParagraphNodes();
        if (!body || state.paragraphs.length === 0) {
            return;
        }

        body.classList.add('twd-tts-pick-mode');
        state.paragraphs.forEach((paragraphEl, index) => {
            if (!(paragraphEl instanceof HTMLElement)) {
                return;
            }
            paragraphEl.classList.add('twd-tts-pick-target');

            const pickBtn = document.createElement('button');
            pickBtn.type = 'button';
            pickBtn.className = 'twd-tts-pick-point';
            pickBtn.title = `Chọn đoạn ${index + 1}`;
            pickBtn.setAttribute('aria-label', `Chọn đoạn ${index + 1}`);
            pickBtn.innerHTML = `
                <svg viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M4 8.2l2.1 2.1L12 4.5"></path>
                </svg>
            `;

            pickBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const selected = setStartParagraphInput(index + 1);
                try {
                    paragraphEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } catch (err) {
                    paragraphEl.scrollIntoView();
                }

                startFromParagraph(selected);
            });

            paragraphEl.insertBefore(pickBtn, paragraphEl.firstChild);
        });
    }

    function setPickMode(active, options) {
        const next = !!active;
        const silent = !!(options && options.silent);

        if (state.pickMode === next) {
            if (next) {
                mountParagraphPickButtons();
            } else {
                unmountParagraphPickButtons();
            }
            updatePickModeButton();
            return;
        }

        state.pickMode = next;
        if (state.pickMode) {
            mountParagraphPickButtons();
            if (!silent) {
                updateStatus('Bật chọn vị trí: bấm nút ở đoạn muốn đọc');
            }
        } else {
            unmountParagraphPickButtons();
            if (!silent) {
                updateStatus('Đã tắt chọn vị trí đọc');
            }
        }
        updatePickModeButton();
    }

    function getChapterTitle() {
        const candidates = [
            '.chapter-name',
            '.top-title .chapter-name',
            '.top-title a.truncate.chapter-name',
            '#bookContentBody p:first-child'
        ];

        for (const selector of candidates) {
            const node = document.querySelector(selector);
            const text = node ? normalizeText(node.textContent) : '';
            if (text) {
                return text;
            }
        }
        return normalizeText(document.title.replace(/\s*-\s*TruyenWikiDich\s*$/i, '')) || 'Chương mới';
    }

    function getNextChapterUrl() {
        const direct = document.querySelector('#btnNextChapter');
        if (direct && direct.href) {
            return direct.href;
        }

        const anchors = Array.from(document.querySelectorAll('a[href]'));
        const found = anchors.find((a) => /chương\s+sau/i.test(normalizeText(a.textContent)));
        return found ? found.href : '';
    }

    function getBookContentSignature() {
        const body = document.querySelector('#bookContentBody');
        if (!body) {
            return '';
        }
        const txt = normalizeText(body.innerText);
        return `${txt.length}|${txt.slice(0, 420)}`;
    }

    function getChapterPartLinks() {

        return Array.from(document.querySelectorAll('a.chapter-part[data-action="loadChapterPart"]'));
    }

    function getNextChapterPartLink() {
        const links = getChapterPartLinks();
        if (!links.length) {
            return null;
        }



        const activeLinks = links.filter((a) => a.classList.contains('active'));
        const activeLink = activeLinks[0] || null;
        if (!activeLink) {
            return null;
        }

        const activePn = Number.parseInt(String(activeLink.dataset.pn || ''), 10);
        if (!Number.isFinite(activePn)) {
            return null;
        }
        const nextPn = activePn + 1;
        const activeId = String(activeLink.dataset.id || '');
        const activeType = String(activeLink.dataset.type || '');

        const next = links.find((a) => {
            const pn = Number.parseInt(String(a.dataset.pn || ''), 10);
            if (!Number.isFinite(pn) || pn !== nextPn) {
                return false;
            }
            if (activeId && String(a.dataset.id || '') !== activeId) {
                return false;
            }
            if (activeType && String(a.dataset.type || '') !== activeType) {
                return false;
            }
            return true;
        });

        return next || null;
    }

    function waitForBookContentChanged(prevSignature, timeoutMs) {
        const timeout = clampInt(timeoutMs, 1000, 30000);
        const start = Date.now();
        return new Promise((resolve) => {
            const tick = () => {
                const nowSig = getBookContentSignature();
                if (nowSig && nowSig !== prevSignature) {
                    resolve(true);
                    return;
                }
                if (Date.now() - start >= timeout) {
                    resolve(false);
                    return;
                }
                setTimeout(tick, 220);
            };
            tick();
        });
    }

    function speakEndOfContentNotice() {
        const msg = 'Bạn đã tới cuối chương. Đây là chương cuối trong trang hiện tại.';
        const token = ++state.utteranceToken;


        if (isRemoteProvider()) {
            const providerId = getProviderId();
            const provider = getRemoteProvider(providerId);
            if (!provider) {
                updateStatus('Không phát được thông báo cuối chương (provider không hỗ trợ)');
                return;
            }
            const voiceId = provider.getVoiceId();
            updateStatus('Đang tạo thông báo cuối chương...');
            getRemoteAudioBase64Cached(providerId, msg, voiceId, { timeout: 14000, retries: 1 })
                .then((base64Audio) => {
                    if (token !== state.utteranceToken) {
                        return;
                    }
                    const audio = getSharedAudio();
                    state.currentAudio = audio;
                    audio.onended = null;
                    audio.onerror = null;
                    audio.src = `data:audio/mpeg;base64,${base64Audio}`;
                    audio.load();
                    applyAudioSettings(audio);
                    updateMediaSession(provider.label || providerId, { text: msg });
                    setMediaSessionPlaybackStateSafe('playing');
                    audio.onended = () => {
                        if (token !== state.utteranceToken) {
                            return;
                        }
                        setMediaSessionPlaybackStateSafe('none');
                        state.currentAudio = null;
                    };
                    audio.onerror = () => {
                        if (token !== state.utteranceToken) {
                            return;
                        }
                        setMediaSessionPlaybackStateSafe('none');
                        state.currentAudio = null;
                        updateStatus('Không phát được thông báo cuối chương');
                    };
                    applyAudioSettings(audio);
                    audio.play().catch(() => {
                        setMediaSessionPlaybackStateSafe('none');
                        updateStatus('Không phát được thông báo cuối chương');
                    });
                })
                .catch((err) => {
                    const m = err && err.message ? err.message : 'unknown';
                    if (providerId === 'tiktok' && err && (err.code === 'NEED_COOKIE' || err.code === 'COOKIE_INVALID')) {
                        provider.onAuthRequired();
                    }
                    updateStatus(`Không tạo được thông báo cuối chương: ${m}`);
                });
            return;
        }


        try {
            speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(msg);
            utter.rate = Math.max(0.5, Math.min(2, Number(state.settings.rate) || 1));
            utter.volume = Math.max(0, Math.min(1, Number(state.settings.volume) || 1));
            const voice = getSelectedVoice();
            if (voice) {
                utter.voice = voice;
                utter.lang = voice.lang;
            } else {
                utter.lang = 'vi-VN';
            }
            try { setMediaSessionPlaybackStateSafe('playing'); } catch (err) { /* ignore */ }
            utter.onend = () => setMediaSessionPlaybackStateSafe('none');
            utter.onerror = () => setMediaSessionPlaybackStateSafe('none');
            speechSynthesis.speak(utter);
        } catch (err) {

        }
    }

    function advanceToNextPartOrChapter() {
        if (!state.settings.autoNext) {
            return false;
        }
        const nextPart = getNextChapterPartLink();
        if (!nextPart) {
            return false;
        }


        stopSpeechOnly();
        state.reading = false;
        state.paused = false;
        clearActiveHighlight();
        updateProgressText(true);

        const prevSig = getBookContentSignature();
        const label = normalizeText(nextPart.textContent) || 'phần tiếp theo';
        updateStatus(`Xong phần, chuyển sang ${label}...`);



        try {
            nextPart.click();
        } catch (err) {
            try {
                nextPart.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            } catch (err2) {

                nextPart.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));
            }
        }

        waitForBookContentChanged(prevSig, 15000).then((ok) => {
            if (!ok) {

                if (state.settings.autoNext && state.nextUrl) {
                    updateStatus('Không tải được phần tiếp theo, chuyển chương sau...');
                    if (state.settings.autoStartOnNextChapter) {
                        saveSessionForNextChapter();
                    }
                    setTimeout(() => {
                        window.location.href = state.nextUrl;
                    }, 650);
                } else {
                    updateStatus('Không tải được phần tiếp theo');
                }
                return;
            }

            refreshChapterData();

            setTimeout(() => startFromParagraph(1), 250);
        });

        return true;
    }

    function getParagraphNodes() {
        const body = document.querySelector('#bookContentBody');
        if (!body) {
            return [];
        }

        const list = Array.from(body.querySelectorAll('p'))
            .filter((p) => normalizeText(p.textContent).length > 0);

        if (list.length > 0) {
            return list;
        }

        return [body];
    }

    function rebuildSegments() {
        stopReading(false);
        const configuredMaxChars = clampInt(state.settings.maxChars, 80, 600);
        state.settings.maxChars = configuredMaxChars;
        let effectiveMaxChars = configuredMaxChars;
        if (isRemoteProvider()) {
            const provider = getActiveRemoteProvider();
            const cap = provider && Number.isFinite(Number(provider.maxCharsCap)) ? Number(provider.maxCharsCap) : 0;
            if (cap > 0) {
                effectiveMaxChars = Math.min(effectiveMaxChars, clampInt(cap, 80, 600));
            }
        }

        const paragraphs = state.paragraphs.slice();
        const firstParagraph = paragraphs[0] ? normalizeText(paragraphs[0].innerText) : '';
        const shouldSkipFirst = firstParagraph && state.title && firstParagraph.toLowerCase() === state.title.toLowerCase();

        const segments = [];

        if (state.settings.includeTitle && state.title) {
            const titleText = applyTtsReplacements(state.title);
            segments.push({
                text: titleText,
                paragraphIndex: -1,
                paragraphEl: null,
                chunkIndex: 0,
                chunkTotal: 1,
                isTitle: true,
                skipTts: isPunctuationOnlyText(titleText)
            });
        }

        paragraphs.forEach((p, paragraphIndex) => {
            if (paragraphIndex === 0 && shouldSkipFirst) {
                return;
            }
            const text = applyTtsReplacements(p.innerText);
            if (!text) {
                return;
            }
            const chunks = splitIntoChunks(text, effectiveMaxChars);
            chunks.forEach((chunk, chunkIndex) => {
                const chunkText = normalizeText(chunk);
                segments.push({
                    text: chunkText,
                    paragraphIndex,
                    paragraphEl: p,
                    chunkIndex,
                    chunkTotal: chunks.length,
                    isTitle: false,
                    skipTts: isPunctuationOnlyText(chunkText)
                });
            });
        });

        state.segments = segments;
        state.segmentIndex = 0;
        updateProgressText();
    }

    function splitIntoChunks(text, maxChars) {
        const clean = normalizeText(text);
        if (!clean) {
            return [];
        }
        if (clean.length <= maxChars) {
            return [clean];
        }

        const sentenceParts = clean.match(/[^.!?。！？\n]+[.!?。！？]?/g) || [clean];
        const chunks = [];
        let current = '';

        sentenceParts.forEach((sentenceRaw) => {
            const sentence = normalizeText(sentenceRaw);
            if (!sentence) {
                return;
            }

            const units = sentence.length > maxChars ? splitLongUnit(sentence, maxChars) : [sentence];
            units.forEach((unit) => {
                if (!current) {
                    current = unit;
                    return;
                }
                const merged = `${current} ${unit}`.trim();
                if (merged.length <= maxChars) {
                    current = merged;
                } else {
                    chunks.push(current);
                    current = unit;
                }
            });
        });

        if (current) {
            chunks.push(current);
        }

        return chunks.length > 0 ? chunks : [clean];
    }


    function splitLongUnit(text, maxChars) {
        const clean = normalizeText(text);
        if (!clean) {
            return [];
        }
        const limit = Math.max(1, clampInt(maxChars, 20, 2000));
        if (clean.length <= limit) {
            return [clean];
        }

        const out = [];
        let rest = clean;
        let guard = 0;
        while (rest.length > limit && guard < 5000) {
            guard += 1;
            const cut = findBestCutIndex(rest, limit);
            const head = normalizeText(rest.slice(0, cut));
            if (head) {
                out.push(head);
            }
            rest = normalizeText(rest.slice(cut));
            if (!rest) {
                break;
            }
        }
        if (rest) {
            out.push(rest);
        }
        if (out.length === 0) {
            return [clean.slice(0, limit)];
        }
        return out;
    }

    function findBestCutIndex(text, maxChars) {
        const s = String(text || '');
        const limit = Math.min(Math.max(1, Number(maxChars) || 1), s.length);
        const nearStart = Math.max(0, limit - SPLIT_NEAR_WINDOW);


        let idx = findLastBreakCharIndex(s, nearStart, limit, BREAK_CHARS_STRONG);
        if (idx < 0) {
            idx = findLastBreakCharIndex(s, 0, limit, BREAK_CHARS_STRONG);
        }

        if (idx < 0) {
            idx = findLastBreakCharIndex(s, nearStart, limit, BREAK_CHARS_COMMA);
        }
        if (idx < 0) {
            idx = findLastBreakCharIndex(s, 0, limit, BREAK_CHARS_COMMA);
        }
        if (idx >= 0) {
            return Math.min(limit, idx + 1);
        }


        const spaceIdx = s.lastIndexOf(' ', limit);
        if (spaceIdx > 0) {
            return Math.min(limit, spaceIdx + 1);
        }
        return limit;
    }

    function findLastBreakCharIndex(text, fromIndex, toIndex, charSet) {
        const s = String(text || '');
        const start = Math.max(0, Number(fromIndex) || 0);
        const end = Math.min(s.length, Number(toIndex) || 0);
        if (!charSet || end <= start) {
            return -1;
        }
        for (let i = end - 1; i >= start; i -= 1) {
            const ch = s[i];
            if (charSet.has(ch)) {
                return i;
            }
        }
        return -1;
    }

    function normalizeText(input) {
        return String(input || '').replace(/\s+/g, ' ').trim();
    }

    function sanitizeReplaceRules(rules) {
        const src = Array.isArray(rules) ? rules : [];
        const out = [];
        for (const item of src) {
            if (!item) {
                continue;
            }
            const from = normalizeText(item.from);
            const to = normalizeText(typeof item.to === 'undefined' ? '' : item.to);
            if (!from) {
                continue;
            }
            out.push({ from, to });
        }
        return out;
    }

    function applyTtsReplacements(input) {
        let text = String(input || '');
        if (!text) {
            return '';
        }
        if (!state.settings.replaceEnabled) {
            return normalizeText(text);
        }
        const rules = sanitizeReplaceRules(state.settings.replaceRules);
        if (rules.length === 0) {
            return normalizeText(text);
        }

        for (const rule of rules) {
            const from = rule.from;
            const to = rule.to;
            if (!from) {
                continue;
            }
            // Replace literal substring (không regex) để tránh vướng ký tự đặc biệt.
            text = text.split(from).join(to);
        }
        return normalizeText(text);
    }


    function isPunctuationOnlyText(input) {
        const s = String(input || '').replace(/\s+/g, '');
        if (!s) {
            return true;
        }
        if (SUPPORTS_UNICODE_PROP_ESCAPES) {
            return !/[\p{L}\p{N}]/u.test(s);
        }

        return !/[0-9A-Za-z\u00C0-\u024F\u1E00-\u1EFF\u4E00-\u9FFF]/.test(s);
    }

    function sleep(ms) {
        const wait = Math.max(0, Number(ms) || 0);
        return new Promise((resolve) => setTimeout(resolve, wait));
    }

    function getRemoteTimeoutMs(provider) {
        const v = clampInt(state.settings.remoteTimeoutMs, 3000, 60000);
        if (Number.isFinite(Number(v)) && v > 0) {
            return v;
        }
        const def = provider && Number(provider.defaultTimeoutMs) > 0 ? Number(provider.defaultTimeoutMs) : TIKTOK_DEFAULT_TIMEOUT_MS;
        return clampInt(def, 3000, 60000);
    }

    function getRemoteRetries(provider) {
        const v = clampInt(state.settings.remoteRetries, 0, 5);
        if (Number.isFinite(Number(v))) {
            return v;
        }
        const def = provider && Number.isFinite(Number(provider.defaultRetries)) ? Number(provider.defaultRetries) : TIKTOK_DEFAULT_RETRIES;
        return clampInt(def, 0, 5);
    }

    function getRemoteMinGapMs(provider) {
        const v = clampInt(state.settings.remoteMinGapMs, 0, 2000);
        if (Number.isFinite(Number(v))) {
            return v;
        }
        const def = provider && Number(provider.defaultMinGapMs) > 0 ? Number(provider.defaultMinGapMs) : TIKTOK_MIN_REQUEST_GAP_MS;
        return clampInt(def, 0, 2000);
    }

    function applyAudioSettings(audio) {
        if (!audio) {
            return;
        }
        try {
            audio.volume = Math.max(0, Math.min(1, Number(state.settings.volume) || 1));
        } catch (err) {
            // ignore
        }
        try {
            audio.playbackRate = Math.max(0.5, Math.min(2, Number(state.settings.rate) || 1));
        } catch (err) {
            // ignore
        }
    }

    function clampInt(value, min, max) {
        const n = Number(value);
        if (!Number.isFinite(n)) {
            return min;
        }
        return Math.max(min, Math.min(max, Math.round(n)));
    }

    function getProviderId() {
        const id = String(state.settings.provider || 'browser');
        if (id === 'browser') {
            return 'browser';
        }
        if (Object.prototype.hasOwnProperty.call(REMOTE_PROVIDERS, id)) {
            return id;
        }
        return 'browser';
    }

    function isRemoteProvider() {
        return getProviderId() !== 'browser';
    }

    function getRemoteProvider(providerId) {
        const id = String(providerId || '');
        return Object.prototype.hasOwnProperty.call(REMOTE_PROVIDERS, id) ? REMOTE_PROVIDERS[id] : null;
    }

    function getActiveRemoteProvider() {
        return isRemoteProvider() ? getRemoteProvider(getProviderId()) : null;
    }

    function isTikTokProvider() {
        return getProviderId() === 'tiktok';
    }

    function openTikTokLogin() {
        window.open('https://www.tiktok.com/login?lang=vi-VN', '_blank', 'noopener,noreferrer');
    }

    function clearRemoteAudioCache() {
        if (state.remoteAudioCache && typeof state.remoteAudioCache.clear === 'function') {
            state.remoteAudioCache.clear();
        }
        if (state.remoteAudioInflight && typeof state.remoteAudioInflight.clear === 'function') {
            state.remoteAudioInflight.clear();
        }
        state.prefetchJobId += 1;
    }

    function clearNextSegmentTimer() {
        if (state.nextSegmentTimer) {
            clearTimeout(state.nextSegmentTimer);
            state.nextSegmentTimer = 0;
        }
    }

    function scheduleSpeakCurrentSegment() {
        clearNextSegmentTimer();
        const delayMs = clampInt(state.settings.segmentDelayMs, 0, 5000);
        const token = state.utteranceToken;
        state.nextSegmentTimer = setTimeout(() => {
            state.nextSegmentTimer = 0;
            if (token !== state.utteranceToken || !state.reading || state.paused) {
                return;
            }
            speakCurrentSegment();
        }, delayMs);
    }

    function getPanelPositionKey() {
        return `${STORAGE_KEY}_panel_pos_v2`;
    }

    function getFabPositionKey() {
        return `${STORAGE_KEY}_fab_pos_v1`;
    }

    function restorePanelPosition() {
        if (!state.ui || !state.ui.panel) {
            return;
        }
        const panel = state.ui.panel;
        try {
            const raw = localStorage.getItem(getPanelPositionKey());
            if (!raw) {
                return;
            }
            const saved = JSON.parse(raw);
            if (!saved || typeof saved.left !== 'number' || typeof saved.top !== 'number') {
                return;
            }

            const maxLeft = Math.max(8, window.innerWidth - panel.offsetWidth - 8);
            const maxTop = Math.max(8, window.innerHeight - panel.offsetHeight - 8);
            const left = Math.min(Math.max(8, saved.left), maxLeft);
            const top = Math.min(Math.max(8, saved.top), maxTop);

            panel.style.left = `${left}px`;
            panel.style.top = `${top}px`;
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
        } catch (err) {
            localStorage.removeItem(getPanelPositionKey());
        }
    }

    function savePanelPosition(left, top) {
        localStorage.setItem(getPanelPositionKey(), JSON.stringify({ left, top }));
    }

    function resetPanelPosition() {
        if (!state.ui || !state.ui.panel) {
            return;
        }
        localStorage.removeItem(getPanelPositionKey());
        const panel = state.ui.panel;
        panel.style.left = 'auto';
        panel.style.top = 'auto';
        panel.style.right = '14px';
        panel.style.bottom = '14px';
    }

    function restoreFabPosition() {
        if (!state.ui || !state.ui.fabBtn) {
            return;
        }
        const fab = state.ui.fabBtn;
        try {
            const raw = localStorage.getItem(getFabPositionKey());
            if (!raw) {
                return;
            }
            const saved = JSON.parse(raw);
            if (!saved || typeof saved.left !== 'number' || typeof saved.top !== 'number') {
                return;
            }

            const fabWidth = Math.max(fab.offsetWidth, 52);
            const fabHeight = Math.max(fab.offsetHeight, 52);
            const maxLeft = Math.max(8, window.innerWidth - fabWidth - 8);
            const maxTop = Math.max(8, window.innerHeight - fabHeight - 8);
            const left = Math.min(Math.max(8, saved.left), maxLeft);
            const top = Math.min(Math.max(8, saved.top), maxTop);

            fab.style.left = `${left}px`;
            fab.style.top = `${top}px`;
            fab.style.right = 'auto';
            fab.style.bottom = 'auto';
        } catch (err) {
            localStorage.removeItem(getFabPositionKey());
        }
    }

    function saveFabPosition(left, top) {
        localStorage.setItem(getFabPositionKey(), JSON.stringify({ left, top }));
    }

    function setPanelVisible(visible, persist) {
        if (!state.ui) {
            return;
        }
        state.ui.panel.classList.toggle('twd-tts-panel-hidden', !visible);
        state.ui.fabBtn.classList.toggle('twd-tts-hidden', visible);
        if (persist !== false) {
            state.settings.panelCollapsed = !visible;
            saveSettings();
        }
    }

    function initPanelDrag() {
        if (!state.ui || !state.ui.dragHandle || !state.ui.fabBtn || !state.ui.panel) {
            return;
        }

        const panel = state.ui.panel;
        const handle = state.ui.dragHandle;
        const fab = state.ui.fabBtn;
        let dragging = false;
        let dragFromFab = false;
        let dragMoved = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let offsetX = 0;
        let offsetY = 0;

        const isInteractive = (el) => (el instanceof Element) && !!el.closest('button, input, textarea, select, label, a');

        const onMove = (event) => {
            if (!dragging) {
                return;
            }
            const target = dragFromFab ? fab : panel;
            const maxLeft = Math.max(8, window.innerWidth - target.offsetWidth - 8);
            const maxTop = Math.max(8, window.innerHeight - target.offsetHeight - 8);
            const left = Math.min(Math.max(8, event.clientX - offsetX), maxLeft);
            const top = Math.min(Math.max(8, event.clientY - offsetY), maxTop);
            if (dragFromFab) {
                if (Math.abs(event.clientX - dragStartX) > 4 || Math.abs(event.clientY - dragStartY) > 4) {
                    dragMoved = true;
                }
            }
            target.style.left = `${left}px`;
            target.style.top = `${top}px`;
            target.style.right = 'auto';
            target.style.bottom = 'auto';
        };

        const onUp = () => {
            if (!dragging) {
                return;
            }
            dragging = false;
            const wasFromFab = dragFromFab;
            if (dragFromFab) {
                fab.classList.remove('twd-tts-fab-dragging');
                if (dragMoved) {
                    fab.dataset.dragMoved = '1';
                }
            }
            dragFromFab = false;
            if (wasFromFab) {
                const rect = fab.getBoundingClientRect();
                saveFabPosition(rect.left, rect.top);
            } else {
                const rect = panel.getBoundingClientRect();
                savePanelPosition(rect.left, rect.top);
            }
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };

        const startDrag = (event, fromFab) => {
            if (event.button !== 0) {
                return false;
            }
            if (!fromFab && isInteractive(event.target)) {
                return false;
            }
            dragging = true;
            dragFromFab = fromFab;
            dragMoved = false;
            dragStartX = event.clientX;
            dragStartY = event.clientY;
            const target = fromFab ? fab : panel;
            const rect = target.getBoundingClientRect();
            offsetX = event.clientX - rect.left;
            offsetY = event.clientY - rect.top;
            target.style.left = `${rect.left}px`;
            target.style.top = `${rect.top}px`;
            target.style.right = 'auto';
            target.style.bottom = 'auto';
            if (fromFab) {
                fab.classList.add('twd-tts-fab-dragging');
                fab.dataset.dragMoved = '0';
            }
            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            return true;
        };

        handle.addEventListener('pointerdown', (event) => {
            startDrag(event, false);
        });

        fab.addEventListener('pointerdown', (event) => {
            if (!state.settings.panelCollapsed) {
                return;
            }
            const started = startDrag(event, true);
            if (started) {
                event.preventDefault();
            }
        });

        handle.addEventListener('dblclick', () => {
            resetPanelPosition();
        });

        window.addEventListener('resize', () => {
            const reposition = (target, saver) => {
                const anchoredByCoords = !!target.style.left && target.style.left !== 'auto';
                if (!anchoredByCoords) {
                    return;
                }
                const rect = target.getBoundingClientRect();
                const maxLeft = Math.max(8, window.innerWidth - target.offsetWidth - 8);
                const maxTop = Math.max(8, window.innerHeight - target.offsetHeight - 8);
                const left = Math.min(Math.max(8, rect.left), maxLeft);
                const top = Math.min(Math.max(8, rect.top), maxTop);
                target.style.left = `${left}px`;
                target.style.top = `${top}px`;
                target.style.right = 'auto';
                target.style.bottom = 'auto';
                saver(left, top);
            };

            reposition(panel, savePanelPosition);
            if (state.settings.panelCollapsed) {
                reposition(fab, saveFabPosition);
            }
        });
    }

    function buildUi() {
        const host = document.createElement('div');
        host.id = 'twd-tts-shadow-host';
        host.style.position = 'fixed';
        host.style.left = '0';
        host.style.top = '0';
        host.style.width = '0';
        host.style.height = '0';
        host.style.zIndex = '2147483647';
        host.style.pointerEvents = 'auto';

        const shadow = host.attachShadow({ mode: 'open' });
        shadow.innerHTML = `
            <style>
                :host {
                    all: initial;
                    --wda-primary: #ff8a65;
                    --wda-primary-strong: #ff7043;
                    --wda-secondary: #26c6da;
                    --wda-secondary-strong: #00acc1;
                    --wda-danger: #ef5350;
                    --wda-danger-strong: #e53935;
                    --wda-surface: #ffffff;
                    --wda-surface-2: #f6f8ff;
                    --wda-border: rgba(98, 110, 140, 0.18);
                    --wda-shadow: 0 18px 40px rgba(53, 64, 90, 0.22);
                    --wda-text: #2f2a36;
                    --wda-muted: #6b6f80;
                    --wda-radius: 14px;
                    --wda-radius-sm: 10px;
                    --wda-mono: "JetBrains Mono", "Cascadia Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
                    font-family: "Be Vietnam Pro", "Noto Sans", "Segoe UI", Arial, sans-serif;
                    color: var(--wda-text);
                    color-scheme: light;
                }

                @media (prefers-color-scheme: dark) {
                    :host {
                        --wda-surface: #0b1220;
                        --wda-surface-2: #111827;
                        --wda-border: rgba(148, 163, 184, 0.25);
                        --wda-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
                        --wda-text: #e5e7eb;
                        --wda-muted: #a3a3b5;
                        color-scheme: dark;
                    }
                }

                .twd-tts-panel {
                    position: fixed;
                    right: 14px;
                    bottom: 14px;
                    width: 360px;
                    background: var(--wda-surface);
                    border: 1px solid var(--wda-border);
                    border-radius: var(--wda-radius);
                    box-shadow: var(--wda-shadow);
                    color: var(--wda-text);
                    font-size: 13px;
                    line-height: 1.45;
                    overflow: hidden;
                }

                .twd-tts-panel.twd-tts-panel-hidden {
                    display: none;
                }

                .twd-tts-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 12px;
                    border-bottom: 1px solid var(--wda-border);
                    background: linear-gradient(135deg, rgba(255, 138, 101, 0.14) 0%, rgba(38, 198, 218, 0.16) 100%);
                    cursor: move;
                    user-select: none;
                }

                .twd-tts-title-wrap {
                    display: grid;
                    gap: 1px;
                    min-width: 0;
                }

                .twd-tts-title {
                    font-weight: 800;
                    font-size: 14px;
                }

                .twd-tts-subtitle {
                    font-size: 11px;
                    color: var(--wda-muted);
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    overflow: hidden;
                }

                .twd-tts-head-actions button {
                    border: 1px solid var(--wda-border);
                    background: var(--wda-surface);
                    border-radius: 6px;
                    width: 24px;
                    height: 24px;
                    padding: 0;
                    line-height: 1;
                    display: grid;
                    place-items: center;
                    cursor: pointer;
                    color: var(--wda-text);
                }

                .twd-tts-head-actions svg {
                    width: 12px;
                    height: 12px;
                    stroke: currentColor;
                    stroke-width: 2.2;
                    fill: none;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                }

                .twd-tts-fab {
                    position: fixed;
                    right: 14px;
                    bottom: 14px;
                    width: 52px;
                    height: 52px;
                    border-radius: 50%;
                    border: none;
                    color: #fff;
                    background: linear-gradient(135deg, var(--wda-secondary) 0%, #42a5f5 100%);
                    box-shadow: 0 10px 24px rgba(30, 64, 175, 0.45);
                    display: grid;
                    place-items: center;
                    cursor: grab;
                    padding: 0;
                }

                .twd-tts-fab svg {
                    width: 26px;
                    height: 26px;
                    stroke: #ffffff;
                    stroke-width: 1.9;
                    fill: none;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                }

                .twd-tts-fab:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 12px 28px rgba(30, 64, 175, 0.5);
                }

                .twd-tts-fab.twd-tts-fab-dragging {
                    cursor: grabbing;
                    transform: none;
                }

                .twd-tts-body {
                    display: grid;
                    gap: 10px;
                    padding: 10px;
                    max-height: 70vh;
                    overflow: auto;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(130, 141, 168, 0.72) rgba(148, 163, 184, 0.18);
                }

                .twd-tts-body.collapsed {
                    display: none;
                }

                .twd-tts-card {
                    background: var(--wda-surface-2);
                    border: 1px solid var(--wda-border);
                    border-radius: var(--wda-radius-sm);
                    padding: 9px;
                }

                .twd-tts-row {
                    margin-bottom: 8px;
                }

                .twd-tts-row:last-child {
                    margin-bottom: 0;
                }

                .twd-tts-status {
                    font-weight: 700;
                    background: rgba(255, 255, 255, 0.5);
                    padding: 8px;
                    border-radius: 8px;
                    border: 1px solid var(--wda-border);
                    font-family: var(--wda-mono);
                    font-size: 12px;
                }

                .twd-tts-buttons {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 6px;
                }

                button {
                    padding: 6px 6px;
                    border-radius: 8px;
                    border: 1px solid var(--wda-border);
                    background: var(--wda-surface);
                    color: var(--wda-text);
                    cursor: pointer;
                    font-weight: 600;
                    transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
                }

                button:hover {
                    transform: translateY(-1px);
                }

                button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }

                .twd-btn-primary {
                    border: none;
                    color: #fff;
                    background: linear-gradient(135deg, var(--wda-primary) 0%, #ffb74d 100%);
                    box-shadow: 0 10px 18px rgba(255, 138, 101, 0.25);
                }

                .twd-btn-primary:hover {
                    box-shadow: 0 12px 20px rgba(255, 138, 101, 0.32);
                }

                .twd-btn-secondary {
                    border: none;
                    color: #fff;
                    background: linear-gradient(135deg, var(--wda-secondary) 0%, #42a5f5 100%);
                    box-shadow: 0 10px 18px rgba(38, 198, 218, 0.26);
                }

                .twd-btn-secondary:hover {
                    box-shadow: 0 12px 20px rgba(38, 198, 218, 0.34);
                }

                .twd-btn-picking {
                    border: none;
                    color: #fff;
                    background: linear-gradient(135deg, #fb8c00 0%, #ff7043 100%);
                    box-shadow: 0 10px 18px rgba(251, 140, 0, 0.35);
                }

                .twd-btn-danger {
                    border: none;
                    color: #fff;
                    background: linear-gradient(135deg, var(--wda-danger) 0%, #ff8a80 100%);
                    box-shadow: 0 10px 18px rgba(239, 83, 80, 0.28);
                }

                .twd-btn-danger:hover {
                    box-shadow: 0 12px 20px rgba(239, 83, 80, 0.36);
                }

                input[type="number"],
                select,
                input[type="range"] {
                    width: 100%;
                    box-sizing: border-box;
                }

                input[type="number"],
                select,
                textarea {
                    border: 1px solid var(--wda-border);
                    border-radius: 10px;
                    background: var(--wda-surface);
                    color: var(--wda-text);
                    box-shadow: inset 0 1px 2px rgba(16, 24, 40, 0.06);
                    font-family: inherit;
                    font-size: 13px;
                    padding: 7px 9px;
                }

                .twd-tts-grid label {
                    display: block;
                    margin-bottom: 3px;
                    font-weight: 600;
                }

                .twd-tts-inline {
                    display: grid;
                    grid-template-columns: 1fr auto;
                    gap: 6px;
                    align-items: center;
                }

                .twd-tts-check {
                    display: block;
                    font-size: 12px;
                    user-select: none;
                }

                .twd-tts-check input {
                    margin-right: 6px;
                }

                .twd-tts-hidden {
                    display: none;
                }

                textarea {
                    width: 100%;
                    box-sizing: border-box;
                    resize: vertical;
                    min-height: 44px;
                    max-height: 120px;
                    font: 12px/1.35 var(--wda-mono);
                    scrollbar-width: thin;
                    scrollbar-color: rgba(130, 141, 168, 0.72) rgba(148, 163, 184, 0.18);
                }

                .twd-tts-cookie-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 6px;
                }

                .twd-tts-cookie-info {
                    font: 11px/1.25 var(--wda-mono);
                    color: var(--wda-muted);
                    background: rgba(255, 255, 255, 0.45);
                    border: 1px solid var(--wda-border);
                    border-radius: 10px;
                    padding: 7px 9px;
                    white-space: pre-wrap;
                    word-break: break-word;
                }

                .twd-tts-small-grid {
                    display: grid;
                    grid-template-columns: 1fr auto;
                    gap: 6px;
                    align-items: center;
                }

                #twd-cookie-modal {
                    position: fixed;
                    inset: 0;
                    z-index: 2147483647;
                    padding: 14px;
                }

                #twd-cookie-modal.twd-tts-hidden {
                    display: none !important;
                }

                #twd-cookie-modal:not(.twd-tts-hidden) {
                    display: grid;
                    place-items: center;
                }

                .twd-cookie-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(2, 6, 23, 0.55);
                    backdrop-filter: blur(6px);
                    z-index: 0;
                }

	                .twd-cookie-modal-dialog {
	                    position: relative;
	                    z-index: 1;
	                    width: min(560px, 92vw);
	                    max-height: min(72vh, 620px);
	                    display: grid;
	                    grid-template-rows: auto 1fr;
	                    border-radius: 14px;
	                    border: 1px solid var(--wda-border);
	                    background: var(--wda-surface);
	                    box-shadow: var(--wda-shadow);
	                    color: var(--wda-text);
	                    overflow: hidden;
	                }

                .twd-cookie-modal-head {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 10px 10px 10px 12px;
                    border-bottom: 1px solid rgba(148, 163, 184, 0.35);
                }

                .twd-cookie-modal-title {
                    font-weight: 800;
                    letter-spacing: 0.02em;
                }

	                .twd-cookie-modal-head button {
	                    border: 1px solid var(--wda-border);
	                    background: var(--wda-surface-2);
	                    border-radius: 10px;
	                    width: 34px;
	                    height: 34px;
	                    padding: 0;
                    line-height: 1;
	                    display: grid;
	                    place-items: center;
	                    cursor: pointer;
	                    color: var(--wda-text);
	                }

                .twd-cookie-modal-head svg {
                    width: 16px;
                    height: 16px;
                    stroke: currentColor;
                    stroke-width: 2.2;
                    fill: none;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                }

                .twd-cookie-modal-body {
                    padding: 10px 12px 12px 12px;
                    overflow: auto;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(130, 141, 168, 0.72) rgba(148, 163, 184, 0.18);
                }

                .twd-cookie-modal-body::-webkit-scrollbar {
                    width: 10px;
                    height: 10px;
                }

                .twd-cookie-modal-body::-webkit-scrollbar-track {
                    background: rgba(148, 163, 184, 0.18);
                    border-radius: 999px;
                }

                .twd-cookie-modal-body::-webkit-scrollbar-thumb {
                    background: rgba(130, 141, 168, 0.72);
                    border-radius: 999px;
                    border: 2px solid transparent;
                    background-clip: padding-box;
                }

	                #twd-cookie-modal-text {
	                    min-height: 180px;
	                    max-height: 45vh;
	                }

	                #twd-repl-modal {
	                    position: fixed;
	                    inset: 0;
	                    z-index: 2147483647;
	                    padding: 14px;
	                }

	                #twd-repl-modal.twd-tts-hidden {
	                    display: none !important;
	                }

	                #twd-repl-modal:not(.twd-tts-hidden) {
	                    display: grid;
	                    place-items: center;
	                }

	                .twd-repl-list {
	                    margin-top: 10px;
	                    display: grid;
	                    gap: 8px;
	                }

	                .twd-repl-row {
	                    display: grid;
	                    grid-template-columns: 1fr auto 1fr auto;
	                    gap: 8px;
	                    align-items: center;
	                }

	                .twd-repl-row input {
	                    width: 100%;
	                    min-width: 0;
	                    padding: 10px 10px;
	                    border-radius: 12px;
	                    border: 1px solid var(--wda-border);
	                    background: var(--wda-surface-2);
	                    color: var(--wda-text);
	                    outline: none;
	                    font: 12px/1.2 var(--wda-mono);
	                }

	                .twd-repl-row .twd-repl-arrow {
	                    font-weight: 800;
	                    color: rgba(15, 23, 42, 0.85);
	                }

	                .twd-repl-row button {
	                    width: 34px;
	                    height: 34px;
	                    border-radius: 12px;
	                    border: 1px solid var(--wda-border);
	                    background: var(--wda-surface-2);
	                    cursor: pointer;
	                    line-height: 1;
	                    display: grid;
	                    place-items: center;
	                    color: var(--wda-text);
	                    font-weight: 900;
	                }

	                .twd-repl-actions {
	                    display: grid;
	                    grid-template-columns: 1fr 1fr;
	                    gap: 6px;
	                    margin-top: 10px;
	                }

	                .twd-repl-bulk {
	                    margin-top: 10px;
	                    border: 1px solid var(--wda-border);
	                    border-radius: 14px;
	                    padding: 8px 10px;
	                    background: var(--wda-surface-2);
	                }

	                .twd-repl-bulk summary {
	                    cursor: pointer;
	                    font-weight: 800;
	                    color: var(--wda-text);
	                    user-select: none;
	                }

	                #twd-repl-bulk-text {
	                    margin-top: 8px;
	                    min-height: 140px;
	                }

	                .twd-repl-bulk-actions {
	                    display: grid;
	                    grid-template-columns: 1fr 1fr;
	                    gap: 6px;
	                    margin-top: 6px;
	                }

                .twd-tts-body::-webkit-scrollbar,
                textarea::-webkit-scrollbar {
                    width: 10px;
                    height: 10px;
                }

                .twd-tts-body::-webkit-scrollbar-track,
                textarea::-webkit-scrollbar-track {
                    background: rgba(148, 163, 184, 0.18);
                    border-radius: 999px;
                }

                .twd-tts-body::-webkit-scrollbar-thumb,
                textarea::-webkit-scrollbar-thumb {
                    background: rgba(130, 141, 168, 0.72);
                    border-radius: 999px;
                    border: 2px solid transparent;
                    background-clip: padding-box;
                }

                .twd-tts-body::-webkit-scrollbar-thumb:hover,
                textarea::-webkit-scrollbar-thumb:hover {
                    background: rgba(101, 112, 140, 0.9);
                    background-clip: padding-box;
                }

                .twd-tts-help {
                    font-size: 11px;
                    color: var(--wda-muted);
                    margin-top: -2px;
                }

                .twd-tts-toggle-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 6px 10px;
                }

                .twd-tts-auth-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 6px;
                    margin-top: 6px;
                }

                @media (max-width: 768px) {
                    .twd-tts-panel {
                        width: min(96vw, 460px);
                    }
                }
            </style>
            <section class="twd-tts-panel">
                <div class="twd-tts-header" id="twd-tts-drag-handle">
                    <div class="twd-tts-title-wrap">
                        <div class="twd-tts-title">TTS Reader</div>
                        <div class="twd-tts-subtitle">TruyệnWikiDich · Shadow UI</div>
                    </div>
                    <div class="twd-tts-head-actions">
                        <button type="button" id="twd-tts-close" title="Thu gọn">
                            <svg viewBox="0 0 16 16" aria-hidden="true">
                                <path d="M3 3l10 10M13 3L3 13"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="twd-tts-body">
                    <section class="twd-tts-card">
                        <div class="twd-tts-row twd-tts-status" id="twd-tts-status">Đang khởi tạo...</div>
                        <div class="twd-tts-row twd-tts-buttons">
                            <button type="button" id="twd-tts-play" class="twd-btn-primary">Play</button>
                            <button type="button" id="twd-tts-pause" class="twd-btn-secondary">Pause</button>
                            <button type="button" id="twd-tts-stop" class="twd-btn-danger">Stop</button>
                            <button type="button" id="twd-tts-next">Next</button>
                        </div>
	                        <div class="twd-tts-row twd-tts-grid">
	                            <label>Bắt đầu từ đoạn</label>
	                            <div class="twd-tts-inline">
	                                <input id="twd-tts-start" type="number" min="1" step="1" value="1" readonly />
	                                <button type="button" id="twd-tts-pick-start" class="twd-btn-secondary">Chọn vị trí</button>
	                            </div>
	                            <div class="twd-tts-inline">
	                                <span class="twd-tts-help">Bấm nút, rồi chọn đoạn trên trang để bắt đầu đọc.</span>
	                            </div>
	                        </div>
	                    </section>

                    <section class="twd-tts-card">
                        <div class="twd-tts-row twd-tts-grid">
                            <label>Nguồn giọng</label>
	                            <select id="twd-tts-provider">
	                                <option value="browser">Browser Speech</option>
	                                <option value="tiktok">TikTok TTS</option>
	                                <option value="google">Google TTS</option>
	                                <option value="bing">Bing TTS</option>
	                            </select>
	                        </div>
                        <div class="twd-tts-row twd-tts-grid">
                            <label>Giọng đọc</label>
                            <select id="twd-tts-voice"></select>
                        </div>
                        <div class="twd-tts-row twd-tts-grid twd-tts-hidden" id="twd-tiktok-auth-row">
                            <div class="twd-tts-help" id="twd-tiktok-auth-msg">TikTok TTS cần cookie phiên (sessionid/sid_tt/sid_guard). Tampermonkey Beta có thể tự lấy; các bản khác cần nhập cookie thủ công.</div>
                            <div class="twd-tts-auth-actions">
                                <button type="button" id="twd-tiktok-login" class="twd-btn-secondary">Mở TikTok</button>
                                <button type="button" id="twd-tiktok-test">Thử giọng</button>
                            </div>
                        </div>
                        <div class="twd-tts-row twd-tts-grid twd-tts-hidden" id="twd-tiktok-cookie-row">
                            <label>Cookie TikTok</label>
                            <div class="twd-tts-cookie-actions">
                                <button type="button" id="twd-tiktok-cookie-enter" class="twd-btn-secondary">Nhập cookie</button>
                                <button type="button" id="twd-tiktok-cookie-clear" class="twd-btn-danger">Xóa cookie</button>
                            </div>
                            <div class="twd-tts-cookie-info" id="twd-tiktok-cookie-info">Chưa có cookie.</div>
                        </div>
                    </section>

                    <section class="twd-tts-card">
                        <div class="twd-tts-row twd-tts-grid">
                            <label>Tốc độ (<span id="twd-rate-text">${state.settings.rate.toFixed(2)}</span>)</label>
                            <input id="twd-rate" type="range" min="0.6" max="1.6" step="0.05" value="${state.settings.rate}" />
                        </div>
                        <div class="twd-tts-row twd-tts-grid">
                            <label>Cao độ (<span id="twd-pitch-text">${state.settings.pitch.toFixed(2)}</span>)</label>
                            <input id="twd-pitch" type="range" min="0.7" max="1.4" step="0.05" value="${state.settings.pitch}" />
                        </div>
                        <div class="twd-tts-row twd-tts-grid">
                            <label>Âm lượng (<span id="twd-volume-text">${state.settings.volume.toFixed(2)}</span>)</label>
                            <input id="twd-volume" type="range" min="0.2" max="1" step="0.05" value="${state.settings.volume}" />
                        </div>
                        <div class="twd-tts-row twd-tts-grid">
                            <label>Max ký tự/chunk</label>
                            <input id="twd-maxchars" type="number" min="80" max="600" step="10" value="${state.settings.maxChars}" />
                        </div>
                        <div class="twd-tts-row twd-tts-grid">
                            <label>Delay giữa mục (ms)</label>
                            <input id="twd-seg-delay" type="number" min="0" max="5000" step="50" value="${clampInt(state.settings.segmentDelayMs, 0, 5000)}" />
                        </div>
	                        <div class="twd-tts-row twd-tts-grid">
	                            <label>Prefetch (remote)</label>
	                            <div class="twd-tts-small-grid">
	                                <label class="twd-tts-check" style="margin:0"><input id="twd-prefetch" type="checkbox" ${state.settings.prefetchEnabled ? 'checked' : ''}/> Bật</label>
	                                <input id="twd-prefetch-count" type="number" min="0" max="6" step="1" value="${clampInt(state.settings.prefetchCount, 0, 6)}" title="Số mục prefetch" />
	                            </div>
	                            <div class="twd-tts-help">Áp dụng cho các giọng remote (TikTok, ...). Browser Speech sẽ bỏ qua.</div>
	                        </div>
	                        <div class="twd-tts-row twd-tts-grid">
	                            <label>Remote: Timeout/Retry/Gap</label>
	                            <div class="twd-tts-small-grid">
	                                <input id="twd-remote-timeout" type="number" min="3000" max="60000" step="500" value="${clampInt(state.settings.remoteTimeoutMs, 3000, 60000)}" title="Timeout (ms)" />
	                                <input id="twd-remote-retries" type="number" min="0" max="5" step="1" value="${clampInt(state.settings.remoteRetries, 0, 5)}" title="Retry" />
	                            </div>
	                            <div class="twd-tts-inline" style="margin-top:6px">
	                                <input id="twd-remote-gap" type="number" min="0" max="2000" step="10" value="${clampInt(state.settings.remoteMinGapMs, 0, 2000)}" title="Min gap (ms)" style="width: 100%" />
	                            </div>
	                            <div class="twd-tts-help">Áp dụng chung cho TikTok/Google/Bing. Gap là khoảng cách tối thiểu giữa 2 request.</div>
	                        </div>
	                        <div class="twd-tts-row twd-tts-grid">
	                            <label>Thay thế khi đọc</label>
	                            <div class="twd-tts-small-grid">
	                                <label class="twd-tts-check" style="margin:0"><input id="twd-repl-enabled" type="checkbox" ${state.settings.replaceEnabled ? 'checked' : ''}/> Bật</label>
	                                <button type="button" id="twd-repl-open" class="twd-btn-secondary">Cài đặt</button>
	                            </div>
	                            <div class="twd-tts-help" id="twd-repl-info"></div>
	                        </div>
	                    </section>

                    <section class="twd-tts-card twd-tts-toggle-grid">
                        <label class="twd-tts-check"><input id="twd-autonext" type="checkbox" ${state.settings.autoNext ? 'checked' : ''}/> Tự qua chương sau</label>
                        <label class="twd-tts-check"><input id="twd-includetitle" type="checkbox" ${state.settings.includeTitle ? 'checked' : ''}/> Đọc tên chương trước</label>
                        <label class="twd-tts-check"><input id="twd-autoscroll" type="checkbox" ${state.settings.autoScroll ? 'checked' : ''}/> Tự cuộn tới đoạn đang đọc</label>
                        <label class="twd-tts-check"><input id="twd-autostart-next" type="checkbox" ${state.settings.autoStartOnNextChapter ? 'checked' : ''}/> Tự phát chương kế tiếp</label>
                    </section>
                </div>
            </section>
	            <button type="button" id="twd-tts-fab" class="twd-tts-fab ${state.settings.panelCollapsed ? '' : 'twd-tts-hidden'}" title="Mở TTS">
	                <svg viewBox="0 0 24 24" aria-hidden="true">
	                    <path d="M4.5 13v4.5a1.5 1.5 0 001.5 1.5h1.2a1.8 1.8 0 001.8-1.8v-3.4A1.8 1.8 0 007.2 12H6a1.5 1.5 0 00-1.5 1z"></path>
	                    <path d="M19.5 13v4.5a1.5 1.5 0 01-1.5 1.5h-1.2a1.8 1.8 0 01-1.8-1.8v-3.4A1.8 1.8 0 0116.8 12H18a1.5 1.5 0 011.5 1z"></path>
	                    <path d="M4.5 13A7.5 7.5 0 0112 5.5 7.5 7.5 0 0119.5 13"></path>
	                </svg>
	            </button>
	            <div class="twd-tts-hidden" id="twd-repl-modal" role="dialog" aria-modal="true">
	                <div class="twd-cookie-modal-overlay" id="twd-repl-modal-overlay"></div>
	                <div class="twd-cookie-modal-dialog twd-repl-modal-dialog">
	                    <div class="twd-cookie-modal-head">
	                        <div class="twd-cookie-modal-title">Thay thế khi đọc</div>
	                        <button type="button" id="twd-repl-modal-close" title="Đóng">
	                            <svg viewBox="0 0 16 16" aria-hidden="true">
	                                <path d="M3 3l10 10M13 3L3 13"></path>
	                            </svg>
	                        </button>
	                    </div>
	                    <div class="twd-cookie-modal-body">
	                        <div class="twd-tts-row twd-tts-grid" style="margin-top:0">
	                            <label>Bật</label>
	                            <label class="twd-tts-check" style="margin:0"><input id="twd-repl-modal-enabled" type="checkbox" ${state.settings.replaceEnabled ? 'checked' : ''}/> Áp dụng thay thế</label>
	                        </div>
	                        <div class="twd-tts-help" id="twd-repl-modal-msg">Mỗi quy tắc là thay chuỗi đúng như nhập. Giá trị thay thế sẽ được trim; để trống nghĩa là xóa khỏi câu đọc.</div>
	                        <div class="twd-repl-list" id="twd-repl-list"></div>
	                        <div class="twd-repl-actions">
	                            <button type="button" id="twd-repl-add" class="twd-btn-secondary">+ Thêm</button>
	                            <button type="button" id="twd-repl-clear" class="twd-btn-danger">Xóa hết</button>
	                        </div>
	                        <details class="twd-repl-bulk">
	                            <summary>Nhập/xuất hàng loạt</summary>
	                            <div class="twd-tts-help">Hỗ trợ JSON hoặc dạng dòng: <code>từ => thay</code>. Dòng trống sẽ bỏ qua.</div>
	                            <textarea id="twd-repl-bulk-text" placeholder="ví dụ:\nTrần Hạ => Trần Hạ (Trần-Hạ)\n____ =>\n\nhoặc JSON: [{\"from\":\"a\",\"to\":\"b\"}]"></textarea>
	                            <div class="twd-repl-bulk-actions">
	                                <button type="button" id="twd-repl-import" class="twd-btn-secondary">Nhập</button>
	                                <button type="button" id="twd-repl-export">Xuất</button>
	                            </div>
	                        </details>
	                        <div class="twd-tts-cookie-actions" style="margin-top:10px">
	                            <button type="button" id="twd-repl-save" class="twd-btn-secondary">Lưu</button>
	                            <button type="button" id="twd-repl-cancel">Hủy</button>
	                        </div>
	                    </div>
	                </div>
	            </div>
	            <div class="twd-tts-hidden" id="twd-cookie-modal" role="dialog" aria-modal="true">
	                <div class="twd-cookie-modal-overlay" id="twd-cookie-modal-overlay"></div>
	                <div class="twd-cookie-modal-dialog">
	                    <div class="twd-cookie-modal-head">
	                        <div class="twd-cookie-modal-title">Nhập Cookie TikTok</div>
                        <button type="button" id="twd-cookie-modal-close" title="Đóng">
                            <svg viewBox="0 0 16 16" aria-hidden="true">
                                <path d="M3 3l10 10M13 3L3 13"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="twd-cookie-modal-body">
                        <div class="twd-tts-help" id="twd-cookie-modal-msg">Dán cookie (JSON/Netscape/Cookie header) rồi bấm Lưu. Cookie sẽ được lưu và không hiển thị lại trong UI.</div>
                        <textarea id="twd-cookie-modal-text" placeholder="Dán Cookie header: a=b; c=d\nHoặc dán JSON cookies\nHoặc dán Netscape cookie file (Cookie-Editor)"></textarea>
                        <div class="twd-tts-cookie-actions" style="margin-top:6px">
                            <button type="button" id="twd-cookie-modal-save" class="twd-btn-secondary">Lưu</button>
                            <button type="button" id="twd-cookie-modal-cancel">Hủy</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(host);
        state.uiHost = host;

        state.ui = {
            panel: shadow.querySelector('.twd-tts-panel'),
            body: shadow.querySelector('.twd-tts-body'),
            dragHandle: shadow.querySelector('#twd-tts-drag-handle'),
            status: shadow.querySelector('#twd-tts-status'),
            playBtn: shadow.querySelector('#twd-tts-play'),
            pauseBtn: shadow.querySelector('#twd-tts-pause'),
            stopBtn: shadow.querySelector('#twd-tts-stop'),
            nextBtn: shadow.querySelector('#twd-tts-next'),
            startInput: shadow.querySelector('#twd-tts-start'),
            providerSelect: shadow.querySelector('#twd-tts-provider'),
            voiceSelect: shadow.querySelector('#twd-tts-voice'),
            tiktokAuthRow: shadow.querySelector('#twd-tiktok-auth-row'),
            tiktokAuthMsg: shadow.querySelector('#twd-tiktok-auth-msg'),
            tiktokLoginBtn: shadow.querySelector('#twd-tiktok-login'),
            tiktokTestBtn: shadow.querySelector('#twd-tiktok-test'),
            tiktokCookieRow: shadow.querySelector('#twd-tiktok-cookie-row'),
            tiktokCookieEnterBtn: shadow.querySelector('#twd-tiktok-cookie-enter'),
            tiktokCookieClearBtn: shadow.querySelector('#twd-tiktok-cookie-clear'),
            tiktokCookieInfo: shadow.querySelector('#twd-tiktok-cookie-info'),
            prefetchInput: shadow.querySelector('#twd-prefetch'),
            prefetchCountInput: shadow.querySelector('#twd-prefetch-count'),
            remoteTimeoutInput: shadow.querySelector('#twd-remote-timeout'),
            remoteRetriesInput: shadow.querySelector('#twd-remote-retries'),
            remoteGapInput: shadow.querySelector('#twd-remote-gap'),
            replaceEnabledInput: shadow.querySelector('#twd-repl-enabled'),
            replaceOpenBtn: shadow.querySelector('#twd-repl-open'),
            replaceInfo: shadow.querySelector('#twd-repl-info'),
            replaceModal: shadow.querySelector('#twd-repl-modal'),
            replaceModalOverlay: shadow.querySelector('#twd-repl-modal-overlay'),
            replaceModalCloseBtn: shadow.querySelector('#twd-repl-modal-close'),
            replaceModalCancelBtn: shadow.querySelector('#twd-repl-cancel'),
            replaceModalSaveBtn: shadow.querySelector('#twd-repl-save'),
            replaceModalEnabledInput: shadow.querySelector('#twd-repl-modal-enabled'),
            replaceModalMsg: shadow.querySelector('#twd-repl-modal-msg'),
            replaceList: shadow.querySelector('#twd-repl-list'),
            replaceAddBtn: shadow.querySelector('#twd-repl-add'),
            replaceClearBtn: shadow.querySelector('#twd-repl-clear'),
            replaceBulkText: shadow.querySelector('#twd-repl-bulk-text'),
            replaceBulkImportBtn: shadow.querySelector('#twd-repl-import'),
            replaceBulkExportBtn: shadow.querySelector('#twd-repl-export'),
            cookieModal: shadow.querySelector('#twd-cookie-modal'),
            cookieModalOverlay: shadow.querySelector('#twd-cookie-modal-overlay'),
            cookieModalCloseBtn: shadow.querySelector('#twd-cookie-modal-close'),
            cookieModalCancelBtn: shadow.querySelector('#twd-cookie-modal-cancel'),
            cookieModalSaveBtn: shadow.querySelector('#twd-cookie-modal-save'),
            cookieModalMsg: shadow.querySelector('#twd-cookie-modal-msg'),
            cookieModalText: shadow.querySelector('#twd-cookie-modal-text'),
            rateInput: shadow.querySelector('#twd-rate'),
            pitchInput: shadow.querySelector('#twd-pitch'),
            volumeInput: shadow.querySelector('#twd-volume'),
            maxCharsInput: shadow.querySelector('#twd-maxchars'),
            segDelayInput: shadow.querySelector('#twd-seg-delay'),
            autoNextInput: shadow.querySelector('#twd-autonext'),
            includeTitleInput: shadow.querySelector('#twd-includetitle'),
            autoScrollInput: shadow.querySelector('#twd-autoscroll'),
            autoStartNextInput: shadow.querySelector('#twd-autostart-next'),
            rateText: shadow.querySelector('#twd-rate-text'),
            pitchText: shadow.querySelector('#twd-pitch-text'),
            volumeText: shadow.querySelector('#twd-volume-text'),
            closeBtn: shadow.querySelector('#twd-tts-close'),
            fabBtn: shadow.querySelector('#twd-tts-fab'),
            pickStartBtn: shadow.querySelector('#twd-tts-pick-start')
        };

        state.ui.providerSelect.value = state.settings.provider;
        restoreFabPosition();
        restorePanelPosition();
        bindUiEvents();
        updateReplaceInfo();
        initPanelDrag();
    }

    function bindUiEvents() {
        const ui = state.ui;
        ui.playBtn.addEventListener('click', onPlayClick);
        ui.pauseBtn.addEventListener('click', onPauseClick);
        ui.stopBtn.addEventListener('click', () => stopReading(true));
        ui.nextBtn.addEventListener('click', onNextClick);
        ui.pickStartBtn.addEventListener('click', () => {
            setPickMode(!state.pickMode);
        });

        ui.providerSelect.addEventListener('change', () => {
            const nextId = String(ui.providerSelect.value || 'browser');
            state.settings.provider = (nextId === 'browser' || getRemoteProvider(nextId)) ? nextId : 'browser';
            saveSettings();
            stopReading(false);
            renderVoiceOptions();
            refreshProviderUi();
            const pid = getProviderId();
            const msg = pid === 'browser'
                ? 'Đã chuyển sang Browser Speech'
                : `Đã chuyển sang ${getRemoteProvider(pid) ? getRemoteProvider(pid).label : pid} TTS`;
            updateStatus(msg);
            rebuildSegments();
            refreshStartRange();
            resetHighlights();
        });

        ui.voiceSelect.addEventListener('change', () => {
            if (isRemoteProvider()) {
                const provider = getActiveRemoteProvider();
                if (provider) {
                    provider.setVoiceId(ui.voiceSelect.value);
                }
            } else {
                state.settings.voiceURI = ui.voiceSelect.value;
            }
            saveSettings();
        });

        const onRemoteSettingsChanged = () => {
            state.settings.remoteTimeoutMs = clampInt(ui.remoteTimeoutInput.value, 3000, 60000);
            state.settings.remoteRetries = clampInt(ui.remoteRetriesInput.value, 0, 5);
            state.settings.remoteMinGapMs = clampInt(ui.remoteGapInput.value, 0, 2000);
            saveSettings();
            clearRemoteAudioCache();
        };

        if (ui.remoteTimeoutInput) {
            ui.remoteTimeoutInput.addEventListener('change', onRemoteSettingsChanged);
        }
        if (ui.remoteRetriesInput) {
            ui.remoteRetriesInput.addEventListener('change', onRemoteSettingsChanged);
        }
        if (ui.remoteGapInput) {
            ui.remoteGapInput.addEventListener('change', onRemoteSettingsChanged);
        }

        ui.tiktokLoginBtn.addEventListener('click', () => {
            openTikTokLogin();
        });

        ui.tiktokTestBtn.addEventListener('click', () => {
            testTikTokTts();
        });

        ui.tiktokCookieEnterBtn.addEventListener('click', () => {
            openTikTokCookieModal({ reason: 'manual' });
        });

        ui.tiktokCookieClearBtn.addEventListener('click', () => {
            state.settings.tiktokCookieText = '';
            saveSettings();
            clearRemoteAudioCache();
            updateTikTokCookieInfo();
            updateStatus('Đã xóa cookie TikTok');
        });

        ui.cookieModalOverlay.addEventListener('click', (event) => {

            event.preventDefault();
            event.stopPropagation();
        });

        const closeCookieModal = () => {
            closeTikTokCookieModal();
        };

        ui.cookieModalCloseBtn.addEventListener('click', closeCookieModal);
        ui.cookieModalCancelBtn.addEventListener('click', closeCookieModal);

        ui.cookieModalSaveBtn.addEventListener('click', () => {
            const raw = String(ui.cookieModalText.value || '');
            const parsed = parseTikTokCookieInput(raw);
            if (parsed.error) {
                ui.cookieModalMsg.textContent = `Không đọc được cookie: ${parsed.error}`;
                return;
            }
            if (!parsed.header) {
                ui.cookieModalMsg.textContent = 'Chưa có nội dung cookie.';
                return;
            }
            if (!parsed.hasSession) {
                ui.cookieModalMsg.textContent = 'Cookie thiếu sessionid/sid_tt/sid_guard. Hãy export lại cookie sau khi đăng nhập TikTok.';
                return;
            }
            state.settings.tiktokCookieText = raw;
            saveSettings();
            clearRemoteAudioCache();
            updateTikTokCookieInfo();
            closeTikTokCookieModal();
            updateStatus('Đã lưu cookie TikTok');
        });

        if (ui.prefetchInput) {
            ui.prefetchInput.addEventListener('change', () => {
                state.settings.prefetchEnabled = !!ui.prefetchInput.checked;
                saveSettings();
                if (!state.settings.prefetchEnabled) {
                    clearRemoteAudioCache();
                }
            });
        }

        if (ui.prefetchCountInput) {
            ui.prefetchCountInput.addEventListener('change', () => {
                state.settings.prefetchCount = clampInt(ui.prefetchCountInput.value, 0, 6);
                ui.prefetchCountInput.value = String(state.settings.prefetchCount);
                saveSettings();
            });
        }

        if (ui.replaceEnabledInput) {
            ui.replaceEnabledInput.addEventListener('change', () => {
                state.settings.replaceEnabled = !!ui.replaceEnabledInput.checked;
                saveSettings();
                updateReplaceInfo();
                applyReplaceRulesAndRebuild({ reason: 'toggle' });
            });
        }

        if (ui.replaceOpenBtn) {
            ui.replaceOpenBtn.addEventListener('click', () => openReplaceModal());
        }

        if (ui.replaceModalOverlay) {
            ui.replaceModalOverlay.addEventListener('click', (event) => {
                // Không cho click ngoài popup tự thoát.
                event.preventDefault();
                event.stopPropagation();
            });
        }

        const closeReplaceModalFn = () => closeReplaceModal();
        if (ui.replaceModalCloseBtn) {
            ui.replaceModalCloseBtn.addEventListener('click', closeReplaceModalFn);
        }
        if (ui.replaceModalCancelBtn) {
            ui.replaceModalCancelBtn.addEventListener('click', closeReplaceModalFn);
        }

        if (ui.replaceAddBtn) {
            ui.replaceAddBtn.addEventListener('click', () => {
                addReplaceRuleRow('', '');
            });
        }

        if (ui.replaceClearBtn) {
            ui.replaceClearBtn.addEventListener('click', () => {
                if (!ui.replaceList) {
                    return;
                }
                ui.replaceList.innerHTML = '';
                updateReplaceModalMsg('Đã xóa danh sách (chưa lưu).');
            });
        }

        if (ui.replaceBulkExportBtn) {
            ui.replaceBulkExportBtn.addEventListener('click', () => {
                if (!ui.replaceBulkText) {
                    return;
                }
                const rules = collectReplaceRulesFromModal();
                ui.replaceBulkText.value = rules.map((r) => `${r.from} => ${r.to}`).join('\n');
                updateReplaceModalMsg(`Đã xuất ${rules.length} quy tắc.`);
            });
        }

        if (ui.replaceBulkImportBtn) {
            ui.replaceBulkImportBtn.addEventListener('click', () => {
                if (!ui.replaceBulkText) {
                    return;
                }
                const parsed = parseReplaceRulesBulkText(ui.replaceBulkText.value);
                if (parsed.error) {
                    updateReplaceModalMsg(`Không nhập được: ${parsed.error}`);
                    return;
                }
                renderReplaceRuleRows(parsed.rules);
                updateReplaceModalMsg(`Đã nhập ${parsed.rules.length} quy tắc (chưa lưu).`);
            });
        }

        if (ui.replaceModalSaveBtn) {
            ui.replaceModalSaveBtn.addEventListener('click', () => {
                const enabled = !!(ui.replaceModalEnabledInput && ui.replaceModalEnabledInput.checked);
                const rules = collectReplaceRulesFromModal();
                state.settings.replaceEnabled = enabled;
                state.settings.replaceRules = rules;
                if (ui.replaceEnabledInput) {
                    ui.replaceEnabledInput.checked = enabled;
                }
                saveSettings();
                closeReplaceModal();
                updateReplaceInfo();
                applyReplaceRulesAndRebuild({ reason: 'save' });
            });
        }

        ui.rateInput.addEventListener('input', () => {
            state.settings.rate = Number(ui.rateInput.value);
            ui.rateText.textContent = state.settings.rate.toFixed(2);
            // Remote audio có thể apply ngay; Browser Speech chỉ apply từ mục kế tiếp.
            if (state.currentAudio) {
                try {
                    state.currentAudio.playbackRate = Math.max(0.5, Math.min(2, Number(state.settings.rate) || 1));
                } catch (err) {
                    // ignore
                }
            }
            saveSettings();
        });

        ui.pitchInput.addEventListener('input', () => {
            state.settings.pitch = Number(ui.pitchInput.value);
            ui.pitchText.textContent = state.settings.pitch.toFixed(2);
            saveSettings();
        });

        ui.volumeInput.addEventListener('input', () => {
            state.settings.volume = Number(ui.volumeInput.value);
            ui.volumeText.textContent = state.settings.volume.toFixed(2);
            if (state.currentAudio) {
                try {
                    state.currentAudio.volume = Math.max(0, Math.min(1, Number(state.settings.volume) || 1));
                } catch (err) {
                    // ignore
                }
            }
            saveSettings();
        });

        ui.maxCharsInput.addEventListener('change', () => {
            state.settings.maxChars = clampInt(ui.maxCharsInput.value, 80, 600);
            ui.maxCharsInput.value = String(state.settings.maxChars);
            saveSettings();
            rebuildSegments();
            refreshStartRange();
            updateStatus('Đã cập nhật chunk');
        });

        ui.segDelayInput.addEventListener('change', () => {
            state.settings.segmentDelayMs = clampInt(ui.segDelayInput.value, 0, 5000);
            ui.segDelayInput.value = String(state.settings.segmentDelayMs);
            saveSettings();
        });

        ui.autoNextInput.addEventListener('change', () => {
            state.settings.autoNext = ui.autoNextInput.checked;
            saveSettings();
        });

        ui.includeTitleInput.addEventListener('change', () => {
            state.settings.includeTitle = ui.includeTitleInput.checked;
            saveSettings();
            rebuildSegments();
            updateStatus('Đã cập nhật đọc tiêu đề');
        });

        ui.autoScrollInput.addEventListener('change', () => {
            state.settings.autoScroll = ui.autoScrollInput.checked;
            saveSettings();
        });

        ui.autoStartNextInput.addEventListener('change', () => {
            state.settings.autoStartOnNextChapter = ui.autoStartNextInput.checked;
            saveSettings();
        });

        ui.closeBtn.addEventListener('click', () => {
            setPanelVisible(false);
        });

        ui.fabBtn.addEventListener('click', () => {
            if (ui.fabBtn.dataset.dragMoved === '1') {
                ui.fabBtn.dataset.dragMoved = '0';
                return;
            }
            setPanelVisible(true);
        });

        setPanelVisible(!state.settings.panelCollapsed, false);
    }

    function onPlayClick() {
        if (state.paused) {
            state.paused = false;
            startSilentAudioKeepAlive();
            setMediaSessionPlaybackStateSafe('playing');
            if (state.currentAudio && state.currentAudio.paused) {
                // Nếu user chỉnh rate/volume lúc đang pause, áp lại trước khi play.
                try {
                    state.currentAudio.volume = Math.max(0, Math.min(1, Number(state.settings.volume) || 1));
                    state.currentAudio.playbackRate = Math.max(0.5, Math.min(2, Number(state.settings.rate) || 1));
                } catch (err) {
                    // ignore
                }
                state.currentAudio.play().catch(() => {
                    speakCurrentSegment();
                });
            } else if (!isRemoteProvider()) {
                try {
                    speechSynthesis.resume();
                } catch (err) {

                }


                if (!speechSynthesis.speaking) {
                    speakCurrentSegment();
                }
            } else {
                speakCurrentSegment();
            }
            updateStatus('Tiếp tục đọc...');
            return;
        }

        if (state.reading) {
            updateStatus('Đang đọc...');
            return;
        }

        const startParagraph = clampInt(state.ui.startInput.value, 1, Math.max(1, state.paragraphs.length));
        startFromParagraph(startParagraph);
    }

    function onPauseClick() {
        if (state.reading && !state.paused) {
            state.paused = true;
            clearNextSegmentTimer();
            stopSilentAudioKeepAlive();
            setMediaSessionPlaybackStateSafe('paused');

            if (state.currentAudio && !state.currentAudio.paused) {
                try { state.currentAudio.pause(); } catch (err) { /* ignore */ }
            }
            try { speechSynthesis.pause(); } catch (err) { /* ignore */ }
            updateStatus('Đang tạm dừng');
            return;
        }

        if (state.reading && state.paused) {
            state.paused = false;
            startSilentAudioKeepAlive();
            setMediaSessionPlaybackStateSafe('playing');
            if (state.currentAudio && state.currentAudio.paused) {
                try {
                    state.currentAudio.volume = Math.max(0, Math.min(1, Number(state.settings.volume) || 1));
                    state.currentAudio.playbackRate = Math.max(0.5, Math.min(2, Number(state.settings.rate) || 1));
                } catch (err) {
                    // ignore
                }
                state.currentAudio.play().catch(() => {
                    speakCurrentSegment();
                });
            } else if (!isRemoteProvider()) {
                try {
                    speechSynthesis.resume();
                } catch (err) {

                }
                if (!speechSynthesis.speaking) {
                    speakCurrentSegment();
                }
            } else {
                speakCurrentSegment();
            }
            updateStatus('Tiếp tục đọc...');
        }
    }

    function onNextClick() {
        if (state.segments.length === 0) {
            return;
        }

        let nextIndex = state.segmentIndex + 1;
        if (!state.reading && !state.paused) {
            const startParagraph = clampInt(state.ui.startInput.value, 1, Math.max(1, state.paragraphs.length));
            nextIndex = findSegmentIndexForParagraph(startParagraph);
        }

        if (nextIndex >= state.segments.length) {
            finishChapter();
            return;
        }

        stopSpeechOnly(true);
        state.segmentIndex = nextIndex;
        speakCurrentSegment();
    }

    function startFromParagraph(paragraphNumber) {
        if (!state.segments.length) {
            updateStatus('Không có nội dung để đọc');
            return;
        }

        if (state.pickMode) {
            setPickMode(false, { silent: true });
        }

        const beginPlay = () => {
            const idx = findSegmentIndexForParagraph(paragraphNumber);
            state.segmentIndex = idx;
            resetHighlights();
            markParagraphsBeforeSegmentAsRead(idx);
            stopSpeechOnly(true);
            speakCurrentSegment();
        };

        beginPlay();
    }

    function findSegmentIndexForParagraph(paragraphNumber) {
        const targetParagraph = Math.max(1, paragraphNumber) - 1;
        if (targetParagraph <= 0 && state.settings.includeTitle && state.segments[0] && state.segments[0].isTitle) {
            return 0;
        }

        const idx = state.segments.findIndex((s) => !s.isTitle && s.paragraphIndex >= targetParagraph);
        if (idx >= 0) {
            return idx;
        }

        return 0;
    }

    function speakCurrentSegment() {
        if (!state.segments[state.segmentIndex]) {
            finishChapter();
            return;
        }

        state.reading = true;
        state.paused = false;

        startSilentAudioKeepAlive();
        setMediaSessionPlaybackStateSafe('playing');

        const segment = state.segments[state.segmentIndex];
        const token = ++state.utteranceToken;

        activateSegmentHighlight(segment);

        if (segment && segment.skipTts) {
            updateStatus('Bỏ qua đoạn chỉ có dấu câu...');
            updateProgressText();
            completeCurrentSegment(segment);
            return;
        }

        if (isRemoteProvider()) {
            speakSegmentWithRemote(segment, token);
        } else {
            speakSegmentWithBrowser(segment, token);
        }
    }

    function speakSegmentWithBrowser(segment, token) {
        const utter = new SpeechSynthesisUtterance(segment.text);
        utter.rate = state.settings.rate;
        utter.pitch = state.settings.pitch;
        utter.volume = state.settings.volume;

        const selectedVoice = getSelectedVoice();
        if (selectedVoice) {
            utter.voice = selectedVoice;
            utter.lang = selectedVoice.lang;
        } else {
            utter.lang = 'vi-VN';
        }

        utter.onstart = () => {
            if (token !== state.utteranceToken) {
                return;
            }
            setMediaSessionPlaybackStateSafe('playing');
            updateStatus('Đang đọc...');
            updateProgressText();
        };

        utter.onend = () => {
            if (token !== state.utteranceToken || !state.reading || state.paused) {
                return;
            }
            completeCurrentSegment(segment);
        };

        utter.onerror = () => {
            if (token !== state.utteranceToken || !state.reading || state.paused) {
                return;
            }
            failCurrentSegment('SpeechSynthesis lỗi, bỏ qua đoạn này');
        };

        speechSynthesis.speak(utter);
    }

    function speakSegmentWithRemote(segment, token) {
        const providerId = getProviderId();
        const provider = getRemoteProvider(providerId);
        if (!provider) {
            failCurrentSegment('Provider TTS chưa hỗ trợ', true);
            return;
        }

        updateStatus(`${provider.label} đang tạo audio...`);
        updateProgressText();
        const voiceId = provider.getVoiceId();
        const segmentIdxSnapshot = state.segmentIndex;
        const timeout = getRemoteTimeoutMs(provider);
        const retries = getRemoteRetries(provider);
        const minGapMs = getRemoteMinGapMs(provider);
        getRemoteAudioBase64Cached(providerId, segment.text, voiceId, {
            timeout,
            retries,
            minGapMs
        })
            .then((base64Audio) => {
                if (token !== state.utteranceToken || !state.reading || state.paused) {
                    return;
                }

                const audio = getSharedAudio();
                state.currentAudio = audio;
                audio.src = `data:audio/mpeg;base64,${base64Audio}`;
                audio.load();
                // Trên mobile, load()/src có thể reset volume/playbackRate => set lại sau load.
                applyAudioSettings(audio);
                updateMediaSession(provider.label, segment);

                audio.onended = () => {
                    if (token !== state.utteranceToken || !state.reading || state.paused) {
                        return;
                    }
                    completeCurrentSegment(segment);
                };

                audio.onerror = () => {
                    if (token !== state.utteranceToken || !state.reading || state.paused) {
                        return;
                    }
                    failCurrentSegment(`Không phát được audio ${provider.label}`);
                };

                applyAudioSettings(audio);
                audio.play().then(() => {
                    if (token !== state.utteranceToken) {
                        return;
                    }
                    updateStatus(`Đang đọc ${provider.label}...`);
                    scheduleRemotePrefetch(providerId, segmentIdxSnapshot + 1);
                }).catch((err) => {
                    failCurrentSegment(`Play ${provider.label} thất bại: ${err && err.message ? err.message : 'unknown'}`);
                });
            })
            .catch((err) => {
                const msg = err && err.message ? err.message : 'unknown';
                if (providerId === 'tiktok' && err && (err.code === 'NEED_COOKIE' || err.code === 'COOKIE_INVALID')) {
                    provider.onAuthRequired();
                }
                failCurrentSegment(`${provider.label} TTS lỗi: ${msg}.`, true);
            });
    }

    function completeCurrentSegment(segment) {
        finalizeSegment(segment);
        state.segmentIndex += 1;
        if (state.segmentIndex >= state.segments.length) {
            finishChapter();
        } else {
            scheduleSpeakCurrentSegment();
        }
    }

    function failCurrentSegment(message, stopNow) {
        if (stopNow) {
            stopReading(false);
            updateStatus(message);
            return;
        }

        state.segmentIndex += 1;
        if (state.segmentIndex >= state.segments.length) {
            finishChapter();
        } else {
            updateStatus(message);
            scheduleSpeakCurrentSegment();
        }
    }

    function getSelectedVoice() {
        const voices = speechSynthesis.getVoices() || [];
        if (!voices.length) {
            return null;
        }

        if (state.settings.voiceURI) {
            const byUri = voices.find((v) => v.voiceURI === state.settings.voiceURI);
            if (byUri) {
                return byUri;
            }
        }

        const vi = voices.find((v) => /vi/i.test(v.lang));
        return vi || voices[0] || null;
    }

    function getTikTokVoice() {
        const voiceId = state.settings.tiktokVoiceId || 'vi_female_huong';
        const found = TIKTOK_VOICES.find((v) => v.id === voiceId);
        return found || TIKTOK_VOICES[0];
    }

    function testTikTokTts() {
        stopReading(false);
        updateStatus('Đang thử giọng TikTok...');
        clearRemoteAudioCache();
        tiktokSynthesizeBase64('Xin chào. Đây là thử giọng TikTok.', state.settings.tiktokVoiceId, { timeout: 20000, retries: 1 })
            .then((base64Audio) => {
                const audio = getSharedAudio();
                state.currentAudio = audio;
                audio.src = `data:audio/mpeg;base64,${base64Audio}`;
                audio.load();
                applyAudioSettings(audio);
                updateMediaSession('TikTok', { text: 'Thử giọng' });
                audio.onended = () => {

                };
                audio.onerror = () => {

                };
                applyAudioSettings(audio);
                return audio.play();
            })
            .then(() => {
                updateStatus('Đang phát thử giọng TikTok...');
            })
            .catch((err) => {
                const msg = err && err.message ? err.message : 'unknown';
                updateStatus(`TikTok TTS lỗi: ${msg}`);
            });
    }

    function openTikTokCookieModal(options) {
        if (!state.ui || !state.ui.cookieModal || !state.ui.cookieModalText || !state.ui.cookieModalMsg) {
            return;
        }
        const reason = options && options.reason ? String(options.reason) : '';
        state.ui.cookieModal.classList.remove('twd-tts-hidden');
        state.ui.cookieModalText.value = '';
        state.ui.cookieModalText.focus();

        const base = 'Dán cookie (JSON/Netscape/Cookie header) rồi bấm Lưu. Cookie sẽ được lưu và không hiển thị lại trong UI.';
        const hint = 'Gợi ý: Tampermonkey Stable/Violentmonkey thường không đọc được cookie HttpOnly, hãy export bằng Cookie-Editor bản beta (hoặc copy Cookie header từ DevTools của TikTok).';
        state.ui.cookieModalMsg.textContent = reason === 'auto'
            ? `TikTok TTS cần cookie phiên. ${base} ${hint}`
            : `${base} ${hint}`;
    }

    function closeTikTokCookieModal() {
        if (!state.ui || !state.ui.cookieModal || !state.ui.cookieModalText) {
            return;
        }
        state.ui.cookieModal.classList.add('twd-tts-hidden');

        state.ui.cookieModalText.value = '';
    }

    function updateReplaceInfo() {
        const ui = state.ui;
        if (!ui || !ui.replaceInfo) {
            return;
        }
        const rules = sanitizeReplaceRules(state.settings.replaceRules);
        const n = rules.length;
        ui.replaceInfo.textContent = state.settings.replaceEnabled
            ? `Đang bật · ${n} quy tắc`
            : `Đang tắt · ${n} quy tắc`;
    }

    function updateReplaceModalMsg(message) {
        const ui = state.ui;
        if (!ui || !ui.replaceModalMsg) {
            return;
        }
        ui.replaceModalMsg.textContent = String(message || '');
    }

    function openReplaceModal() {
        const ui = state.ui;
        if (!ui || !ui.replaceModal || !ui.replaceList || !ui.replaceModalEnabledInput) {
            return;
        }
        ui.replaceModal.classList.remove('twd-tts-hidden');
        ui.replaceModalEnabledInput.checked = !!state.settings.replaceEnabled;
        renderReplaceRuleRows(sanitizeReplaceRules(state.settings.replaceRules));
        if (ui.replaceBulkText) {
            ui.replaceBulkText.value = '';
        }
        updateReplaceModalMsg('Mỗi quy tắc là thay chuỗi đúng như nhập. Giá trị thay thế sẽ được trim; để trống nghĩa là xóa khỏi câu đọc.');
        const first = ui.replaceList.querySelector('input');
        if (first) {
            first.focus();
        }
    }

    function closeReplaceModal() {
        const ui = state.ui;
        if (!ui || !ui.replaceModal) {
            return;
        }
        ui.replaceModal.classList.add('twd-tts-hidden');
        if (ui.replaceBulkText) {
            ui.replaceBulkText.value = '';
        }
    }

    function createReplaceRuleRowEl(from, to) {
        const row = document.createElement('div');
        row.className = 'twd-repl-row';

        const fromInput = document.createElement('input');
        fromInput.type = 'text';
        fromInput.className = 'twd-repl-from';
        fromInput.placeholder = 'Cụm từ gốc';
        fromInput.value = String(from || '');

        const arrow = document.createElement('div');
        arrow.className = 'twd-repl-arrow';
        arrow.textContent = '→';

        const toInput = document.createElement('input');
        toInput.type = 'text';
        toInput.className = 'twd-repl-to';
        toInput.placeholder = 'Thay bằng (rỗng = xóa)';
        toInput.value = String(to || '');

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.title = 'Xóa quy tắc';
        delBtn.textContent = '×';
        delBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            row.remove();
        });

        row.appendChild(fromInput);
        row.appendChild(arrow);
        row.appendChild(toInput);
        row.appendChild(delBtn);
        return row;
    }

    function addReplaceRuleRow(from, to) {
        const ui = state.ui;
        if (!ui || !ui.replaceList) {
            return;
        }
        const maybeHelp = ui.replaceList.querySelector('.twd-tts-help');
        if (maybeHelp && ui.replaceList.children.length === 1) {
            maybeHelp.remove();
        }
        const row = createReplaceRuleRowEl(from, to);
        ui.replaceList.appendChild(row);
        const input = row.querySelector('input');
        if (input) {
            input.focus();
        }
    }

    function renderReplaceRuleRows(rules) {
        const ui = state.ui;
        if (!ui || !ui.replaceList) {
            return;
        }
        ui.replaceList.innerHTML = '';
        const list = sanitizeReplaceRules(rules);
        if (list.length === 0) {
            const help = document.createElement('div');
            help.className = 'twd-tts-help';
            help.textContent = 'Chưa có quy tắc. Bấm "+ Thêm" để tạo.';
            ui.replaceList.appendChild(help);
            return;
        }
        list.forEach((r) => ui.replaceList.appendChild(createReplaceRuleRowEl(r.from, r.to)));
    }

    function collectReplaceRulesFromModal() {
        const ui = state.ui;
        if (!ui || !ui.replaceList) {
            return [];
        }
        const rows = Array.from(ui.replaceList.querySelectorAll('.twd-repl-row'));
        const rules = [];
        rows.forEach((row) => {
            const from = row.querySelector('input.twd-repl-from') ? normalizeText(row.querySelector('input.twd-repl-from').value) : '';
            const to = row.querySelector('input.twd-repl-to') ? normalizeText(row.querySelector('input.twd-repl-to').value) : '';
            if (!from) {
                return;
            }
            rules.push({ from, to });
        });
        return sanitizeReplaceRules(rules);
    }

    function parseReplaceRulesBulkText(raw) {
        const text = String(raw || '').trim();
        if (!text) {
            return { rules: [], error: '' };
        }

        if (text.startsWith('[') || text.startsWith('{')) {
            try {
                const json = JSON.parse(text);
                const arr = Array.isArray(json)
                    ? json
                    : (json && Array.isArray(json.rules) ? json.rules : null);
                if (!arr) {
                    return { rules: [], error: 'JSON không đúng định dạng (cần array hoặc {rules:[...]})' };
                }
                return { rules: sanitizeReplaceRules(arr), error: '' };
            } catch (err) {
                return { rules: [], error: 'JSON parse lỗi' };
            }
        }

        const rules = [];
        const lines = text.split(/\r?\n/);
        for (const line of lines) {
            const ln = String(line || '').trim();
            if (!ln) {
                continue;
            }
            if (ln.startsWith('#') || ln.startsWith('//')) {
                continue;
            }
            let from = '';
            let to = '';
            if (ln.includes('=>')) {
                const parts = ln.split('=>');
                from = normalizeText(parts[0]);
                to = normalizeText(parts.slice(1).join('=>'));
            } else if (ln.includes('\t')) {
                const parts = ln.split('\t');
                from = normalizeText(parts[0]);
                to = normalizeText(parts.slice(1).join('\t'));
            } else {
                from = normalizeText(ln);
                to = '';
            }
            if (!from) {
                continue;
            }
            rules.push({ from, to });
        }
        return { rules: sanitizeReplaceRules(rules), error: '' };
    }

    function applyReplaceRulesAndRebuild(options) {
        const wasReading = !!state.reading && !state.paused;
        const wasPaused = !!state.reading && !!state.paused;

        const currentSeg = state.segments && state.segments[state.segmentIndex] ? state.segments[state.segmentIndex] : null;
        const resumeParagraph = (currentSeg && !currentSeg.isTitle && Number.isFinite(Number(currentSeg.paragraphIndex)))
            ? (Number(currentSeg.paragraphIndex) + 1)
            : clampInt(state.ui && state.ui.startInput ? state.ui.startInput.value : 1, 1, Math.max(1, state.paragraphs.length));

        clearRemoteAudioCache();
        rebuildSegments();
        refreshStartRange();
        resetHighlights();
        setStartParagraphInput(resumeParagraph);

        const idx = findSegmentIndexForParagraph(resumeParagraph);
        markParagraphsBeforeSegmentAsRead(idx);
        const seg = state.segments[idx];
        if (seg) {
            activateSegmentHighlight(seg);
        }
        updateProgressText();

        const reason = options && options.reason ? String(options.reason) : '';
        if (wasReading) {
            updateStatus(reason === 'toggle' ? 'Đã áp dụng thay thế, tiếp tục đọc...' : 'Đã lưu thay thế, tiếp tục đọc...');
            startFromParagraph(resumeParagraph);
            return;
        }
        if (wasPaused) {
            state.segmentIndex = idx;
            state.reading = true;
            state.paused = true;
            updateStatus(reason === 'toggle' ? 'Đã áp dụng thay thế (đang tạm dừng)' : 'Đã lưu thay thế (đang tạm dừng)');
        }
    }

    function createRemoteCacheKey(providerId, voiceId, text) {
        const provider = String(providerId || '');
        const voice = String(voiceId || '');
        const cleanText = normalizeText(text);
        return `${provider}\n${voice}\n${cleanText}`;
    }

    function cacheRemoteAudio(key, base64Audio) {
        if (!state.remoteAudioCache) {
            return;
        }

        if (state.remoteAudioCache.has(key)) {
            state.remoteAudioCache.delete(key);
        }
        state.remoteAudioCache.set(key, base64Audio);
        while (state.remoteAudioCache.size > TIKTOK_MAX_CACHE_ITEMS) {
            const firstKey = state.remoteAudioCache.keys().next().value;
            if (!firstKey) {
                break;
            }
            state.remoteAudioCache.delete(firstKey);
        }
    }

    function getRemoteAudioBase64Cached(providerId, text, voiceId, options) {
        const provider = getRemoteProvider(providerId);
        if (!provider) {
            return Promise.reject(new Error('Provider chưa hỗ trợ'));
        }

        const key = createRemoteCacheKey(providerId, voiceId, text);
        if (state.remoteAudioCache && state.remoteAudioCache.has(key)) {
            return Promise.resolve(state.remoteAudioCache.get(key));
        }
        if (state.remoteAudioInflight && state.remoteAudioInflight.has(key)) {
            return state.remoteAudioInflight.get(key);
        }

        const p = provider.synthesizeBase64(text, voiceId, options)
            .then((audio) => {
                if (state.remoteAudioInflight) {
                    state.remoteAudioInflight.delete(key);
                }
                cacheRemoteAudio(key, audio);
                return audio;
            })
            .catch((err) => {
                if (state.remoteAudioInflight) {
                    state.remoteAudioInflight.delete(key);
                }
                return Promise.reject(err);
            });

        if (state.remoteAudioInflight) {
            state.remoteAudioInflight.set(key, p);
        }
        return p;
    }

    function scheduleRemotePrefetch(providerId, fromIndex) {
        if (!state.settings.prefetchEnabled) {
            return;
        }
        const provider = getRemoteProvider(providerId);
        if (!provider) {
            return;
        }

        const count = clampInt(state.settings.prefetchCount, 0, 6);
        if (count <= 0) {
            return;
        }

        const jobId = ++state.prefetchJobId;
        const prefetchDelayMs = Number(provider.prefetchDelayMs) > 0 ? Number(provider.prefetchDelayMs) : TIKTOK_PREFETCH_DELAY_MS;
        const timeout = getRemoteTimeoutMs(provider);
        const retries = getRemoteRetries(provider);
        const minGap = getRemoteMinGapMs(provider);
        setTimeout(() => {
            if (jobId !== state.prefetchJobId) {
                return;
            }
            if (!state.reading || state.paused || !isRemoteProvider() || getProviderId() !== providerId) {
                return;
            }
            const voiceId = provider.getVoiceId();

            (async () => {
                let fetched = 0;
                let idx = Math.max(0, Number(fromIndex) || 0);
                while (fetched < count) {
                    if (jobId !== state.prefetchJobId) {
                        return;
                    }
                    if (!state.reading || state.paused || !isRemoteProvider() || getProviderId() !== providerId) {
                        return;
                    }
                    const seg = state.segments[idx];
                    idx += 1;
                    if (!seg) {
                        return;
                    }
                    if (!seg.text || seg.skipTts) {
                        continue;
                    }
                    try {
                        await getRemoteAudioBase64Cached(providerId, seg.text, voiceId, {
                            timeout: Math.min(timeout, 16000),
                            retries: Math.min(retries, 1),
                            minGapMs: Math.max(minGap, 320)
                        });
                        fetched += 1;
                    } catch (err) {

                    }
                    await sleep(220);
                }
            })();
        }, prefetchDelayMs);
    }

    function updateTikTokCookieInfo() {
        if (!state.ui || !state.ui.tiktokCookieInfo) {
            return;
        }
        const raw = String(state.settings.tiktokCookieText || '');
        if (!raw.trim()) {
            state.ui.tiktokCookieInfo.textContent = 'Chưa có cookie.';
            return;
        }
        const parsed = parseTikTokCookieInput(raw);
        if (parsed.error) {
            state.ui.tiktokCookieInfo.textContent = 'Cookie đang lưu bị lỗi định dạng (đã ẩn).';
            return;
        }
        state.ui.tiktokCookieInfo.textContent = parsed.hasSession
            ? `Đã lưu cookie (ẩn). Định dạng: ${parsed.format}.`
            : `Đã lưu cookie (ẩn) nhưng thiếu sessionid/sid_tt/sid_guard.`;
    }

    function parseTikTokCookieInput(raw) {
        const text = String(raw || '').trim();
        if (!text) {
            return { header: '', names: [], hasSession: false, format: 'empty', error: '' };
        }


        const stripCookiePrefix = (s) => String(s || '').replace(/^\s*cookie\s*:\s*/i, '').trim();


        if (text.startsWith('{') || text.startsWith('[')) {
            try {
                const json = JSON.parse(text);
                const map = new Map();

                const pushPair = (name, value) => {
                    const n = String(name || '').trim();
                    if (!n) {
                        return;
                    }
                    const v = String(value || '');
                    map.set(n, v);
                };

                if (typeof json === 'string') {
                    const header = normalizeCookieHeader(stripCookiePrefix(json));
                    const names = Object.keys(parseCookieHeader(header)).sort();
                    return { header, names, hasSession: hasSessionCookie(header), format: 'json:string', error: '' };
                }

                const arr = Array.isArray(json)
                    ? json
                    : (json && Array.isArray(json.cookies) ? json.cookies : null);

                if (arr) {
                    arr.forEach((c) => {
                        if (!c) {
                            return;
                        }

                        pushPair(c.name, typeof c.value !== 'undefined' ? c.value : '');
                    });
                    const header = headerFromMap(map);
                    const names = Array.from(map.keys()).sort();
                    return { header, names, hasSession: hasSessionCookie(header), format: 'json:cookies', error: '' };
                }

                if (json && typeof json === 'object') {
                    if (typeof json.cookie === 'string') {
                        const header = normalizeCookieHeader(stripCookiePrefix(json.cookie));
                        const names = Object.keys(parseCookieHeader(header)).sort();
                        return { header, names, hasSession: hasSessionCookie(header), format: 'json:cookie', error: '' };
                    }


                    Object.keys(json).forEach((k) => {
                        const v = json[k];
                        if (typeof v === 'string' || typeof v === 'number') {
                            pushPair(k, v);
                        }
                    });
                    const header = headerFromMap(map);
                    const names = Array.from(map.keys()).sort();
                    return { header, names, hasSession: hasSessionCookie(header), format: 'json:map', error: '' };
                }
            } catch (err) {

            }
        }


        if (/\t/.test(text)) {
            const map = new Map();
            const lines = text.split(/\r?\n/);
            lines.forEach((line) => {
                const ln = String(line || '').trim();
                if (!ln) {
                    return;
                }

                let work = ln;
                if (work.startsWith('#HttpOnly_')) {
                    work = work.slice('#HttpOnly_'.length);
                } else if (work.startsWith('#')) {
                    return;
                }
                const parts = work.split('\t');
                if (parts.length < 7) {
                    return;
                }
                const name = parts[5];
                const value = parts[6];
                if (!name) {
                    return;
                }
                map.set(String(name), String(value || ''));
            });

            if (map.size > 0) {
                const header = headerFromMap(map);
                const names = Array.from(map.keys()).sort();
                return { header, names, hasSession: hasSessionCookie(header), format: 'netscape', error: '' };
            }
        }


        const header = normalizeCookieHeader(stripCookiePrefix(text));
        const names = Object.keys(parseCookieHeader(header)).sort();
        return { header, names, hasSession: hasSessionCookie(header), format: 'header', error: '' };
    }

    function hasSessionCookie(cookieHeader) {
        const txt = String(cookieHeader || '');
        return /(?:^|;\s*)(sessionid|sid_tt|sid_guard)=/i.test(txt);
    }

    function normalizeCookieHeader(cookieHeader) {
        const map = parseCookieHeader(cookieHeader);
        const entries = Object.entries(map);
        return entries.map(([k, v]) => `${k}=${v}`).join('; ');
    }

    function headerFromMap(map) {
        const out = [];
        map.forEach((value, name) => {
            out.push(`${name}=${value}`);
        });
        return out.join('; ');
    }

    function parseCookieHeader(cookieHeader) {
        const text = String(cookieHeader || '').trim();
        if (!text) {
            return {};
        }
        const map = {};
        text.split(';').forEach((part) => {
            const item = part.trim();
            if (!item) {
                return;
            }
            const eqIndex = item.indexOf('=');
            if (eqIndex <= 0) {
                return;
            }
            const name = item.slice(0, eqIndex).trim();
            const value = item.slice(eqIndex + 1).trim();
            if (!name) {
                return;
            }
            map[name] = value;
        });
        return map;
    }

    function tiktokSynthesizeBase64(text, voiceId, options) {
        if (typeof GM_xmlhttpRequest !== 'function') {
            return Promise.reject(new Error('Trình duyệt không hỗ trợ GM_xmlhttpRequest'));
        }

        const cleanText = normalizeText(text);
        if (!cleanText) {
            return Promise.reject(new Error('Text rỗng'));
        }
        const opts = options || {};


        let cookieHeader = '';
        if (state.gmCookieCapability === 'full' && state.gmCookieHeader) {
            cookieHeader = state.gmCookieHeader;
        } else {

            const cookieRaw = String(state.settings.tiktokCookieText || '');
            let cookieParsed = null;
            if (state.tiktokCookieParsedCache && state.tiktokCookieParsedCache.raw === cookieRaw && state.tiktokCookieParsedCache.parsed) {
                cookieParsed = state.tiktokCookieParsedCache.parsed;
            } else {
                cookieParsed = parseTikTokCookieInput(cookieRaw);
                state.tiktokCookieParsedCache = { raw: cookieRaw, parsed: cookieParsed };
            }
            if (!cookieParsed.header) {
                const err = new Error('Chưa nhập cookie TikTok');
                err.code = 'NEED_COOKIE';
                return Promise.reject(err);
            }
            if (!cookieParsed.hasSession) {
                const err = new Error('Cookie TikTok thiếu sessionid/sid_tt/sid_guard');
                err.code = 'COOKIE_INVALID';
                return Promise.reject(err);
            }
            cookieHeader = cookieParsed.header;
        }

        const voice = voiceId || getTikTokVoice().id;
        const timeoutMs = Number(opts.timeout) > 0 ? Number(opts.timeout) : TIKTOK_DEFAULT_TIMEOUT_MS;
        const retries = clampInt(opts.retries, 0, 4);
        const minGapMs = clampInt(opts.minGapMs, 0, 2000) || TIKTOK_MIN_REQUEST_GAP_MS;
        const query = `text_speaker=${encodeURIComponent(voice)}&req_text=${encodeURIComponent(cleanText)}&speaker_map_type=0&aid=1233`;
        return invokeTikTokRequestWithRetry(`${TIKTOK_API_ENDPOINT}?${query}`, {
            'User-Agent': TIKTOK_USER_AGENT,
            'Accept': 'application/json, text/plain, */*',
            'Cookie': cookieHeader
        }, timeoutMs, retries, minGapMs);
    }

    function invokeTikTokRequestWithRetry(url, headers, timeoutMs, retries, minGapMs) {
        const attemptCount = Math.max(1, Number(retries) + 1);
        let attempt = 0;
        let lastErr = null;

        const run = () => {
            attempt += 1;
            return invokeTikTokRequestWithGap(url, headers, timeoutMs, minGapMs)
                .catch((err) => {
                    lastErr = err;
                    if (attempt >= attemptCount) {
                        return Promise.reject(lastErr);
                    }
                    const jitter = Math.floor(Math.random() * 220);
                    const backoff = (TIKTOK_RETRY_BASE_DELAY_MS * attempt) + jitter;
                    return sleep(backoff).then(run);
                });
        };

        return run();
    }

    function invokeTikTokRequestWithGap(url, headers, timeoutMs, minGapMs) {
        const gap = Math.max(0, Number(minGapMs) || 0);
        const now = Date.now();
        const lastAt = Number(state.tiktokLastTikTokRequestAt || 0);
        const wait = (gap > 0 && lastAt > 0) ? Math.max(0, gap - (now - lastAt)) : 0;
        return sleep(wait).then(() => {
            state.tiktokLastTikTokRequestAt = Date.now();
            return invokeTikTokRequest(url, headers, timeoutMs);
        });
    }

    function invokeTikTokRequest(url, headers, timeoutMs) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url,
                headers,
                timeout: timeoutMs,
                anonymous: false,
                withCredentials: true,
                onload: (res) => {
                    try {
                        const httpStatus = Number(res && typeof res.status !== 'undefined' ? res.status : 0);
                        const body = String(res && typeof res.responseText !== 'undefined' ? res.responseText : '').trim();
                        if (!body) {
                            const err = new Error('response empty');
                            err.code = httpStatus === 401 || httpStatus === 403 ? 'COOKIE_INVALID' : '';
                            reject(err);
                            return;
                        }
                        const json = JSON.parse(body);
                        if (json && Number(json.status_code) === 0 && json.data && json.data.v_str) {
                            resolve(json.data.v_str);
                            return;
                        }
                        const msg = (json && (json.status_msg || json.message)) || `status_code=${json && json.status_code}`;
                        const err = new Error(msg);
                        if (httpStatus === 401 || httpStatus === 403) {
                            err.code = 'COOKIE_INVALID';
                        }
                        reject(err);
                    } catch (err) {
                        reject(new Error('response not json'));
                    }
                },
                onerror: () => reject(new Error('request error')),
                ontimeout: () => reject(new Error('request timeout'))
            });
        });
    }

    function googleSynthesizeBase64(text, voiceId, options) {
        if (typeof GM_xmlhttpRequest !== 'function') {
            return Promise.reject(new Error('Trình duyệt không hỗ trợ GM_xmlhttpRequest'));
        }

        const cleanText = normalizeText(text);
        if (!cleanText) {
            return Promise.reject(new Error('Text rỗng'));
        }

        const voiceInfo = GOOGLE_VOICES.find(v => v.id === String(voiceId || ''));
        const lang = voiceInfo && voiceInfo.language ? voiceInfo.language : 'vi';

        const opts = options || {};
        const timeoutMs = Number(opts.timeout) > 0 ? Number(opts.timeout) : GOOGLE_DEFAULT_TIMEOUT_MS;
        const retries = clampInt(opts.retries, 0, 4);
        const minGapMs = clampInt(opts.minGapMs, 0, 2000) || GOOGLE_MIN_REQUEST_GAP_MS;

        const payload = getGoogleTranslateTtsPayload(cleanText, lang);
        const body = `f.req=${encodeURIComponent(payload)}`;
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            'Accept': '*/*'
        };
        return invokeGoogleRequestWithRetry(GOOGLE_API_ENDPOINT, headers, body, timeoutMs, retries, minGapMs);
    }

    // vBook: endpoint batchexecute, RPC "jQ1olc", trả về base64 mp3 ở contentArray[0]
    function getGoogleTranslateTtsPayload(text, lang) {
        const data = [];
        data.push('jQ1olc');
        const content = [String(text || ''), String(lang || 'vi'), null, 'null'];
        data.push(JSON.stringify(content));
        data.push(null);
        data.push('generic');
        return JSON.stringify([[data]]);
    }

    function invokeGoogleRequestWithRetry(url, headers, body, timeoutMs, retries, minGapMs) {
        const attemptCount = Math.max(1, Number(retries) + 1);
        let attempt = 0;
        let lastErr = null;
        const run = () => {
            attempt += 1;
            return invokeGoogleRequestWithGap(url, headers, body, timeoutMs, minGapMs)
                .catch((err) => {
                    lastErr = err;
                    if (attempt >= attemptCount) {
                        return Promise.reject(lastErr);
                    }
                    const jitter = Math.floor(Math.random() * 180);
                    const backoff = (420 * attempt) + jitter;
                    return sleep(backoff).then(run);
                });
        };
        return run();
    }

    function invokeGoogleRequestWithGap(url, headers, body, timeoutMs, minGapMs) {
        const gap = Math.max(0, Number(minGapMs) || 0);
        const now = Date.now();
        const lastAt = Number(state.googleLastRequestAt || 0);
        const wait = (gap > 0 && lastAt > 0) ? Math.max(0, gap - (now - lastAt)) : 0;
        return sleep(wait).then(() => {
            state.googleLastRequestAt = Date.now();
            return invokeGoogleRequest(url, headers, body, timeoutMs);
        });
    }

    function invokeGoogleRequest(url, headers, body, timeoutMs) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url,
                headers,
                data: body,
                timeout: timeoutMs,
                anonymous: true,
                withCredentials: false,
                onload: (res) => {
                    try {
                        const httpStatus = Number(res && typeof res.status !== 'undefined' ? res.status : 0);
                        const raw = String(res && typeof res.responseText !== 'undefined' ? res.responseText : '');
                        if (!raw.trim()) {
                            reject(new Error('response empty'));
                            return;
                        }

                        if (httpStatus < 200 || httpStatus >= 300) {
                            reject(new Error(`HTTP ${httpStatus}`));
                            return;
                        }

                        const cleaned = raw.replace(/^\)\]\}'\s*/, '').trim();
                        const jsonArray = JSON.parse(cleaned);
                        const contentArray = JSON.parse(jsonArray[0][2]);
                        const base64 = contentArray && contentArray[0] ? String(contentArray[0]) : '';
                        if (!base64) {
                            reject(new Error('no audio'));
                            return;
                        }
                        resolve(base64);
                    } catch (err) {
                        reject(new Error('response not json'));
                    }
                },
                onerror: () => reject(new Error('request error')),
                ontimeout: () => reject(new Error('request timeout'))
            });
        });
    }

    function arrayBufferToBase64(buffer) {
        if (!buffer) {
            return '';
        }
        const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer.buffer || buffer);
        if (!bytes || bytes.length === 0) {
            return '';
        }
        let binary = '';
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.subarray(i, i + chunkSize);
            let part = '';
            for (let j = 0; j < chunk.length; j += 1) {
                part += String.fromCharCode(chunk[j]);
            }
            binary += part;
        }
        try {
            return btoa(binary);
        } catch (err) {
            return '';
        }
    }

    function escapeXml(unsafe) {
        return String(unsafe || '').replace(/[<>&'"]/g, (c) => {
            switch (c) {
                case '<':
                    return '&lt;';
                case '>':
                    return '&gt;';
                case '&':
                    return '&amp;';
                case '\'':
                    return '&apos;';
                case '"':
                    return '&quot;';
                default:
                    return c;
            }
        });
    }

    function parseBingVoice(voiceId) {
        const raw = String(voiceId || '').trim();
        if (!raw) {
            return null;
        }
        const parts = raw.split(';');
        const voiceName = String(parts[0] || '').trim();
        const gender = String(parts[1] || '').trim() || 'Female';
        if (!voiceName) {
            return null;
        }
        const segs = voiceName.split('-');
        const lang = (segs.length >= 2) ? `${segs[0]}-${segs[1]}` : 'vi-VN';
        return { voiceName, gender, lang };
    }

    function buildBingSsml(text, voiceInfo) {
        const info = voiceInfo || { lang: 'vi-VN', voiceName: 'vi-VN-HoaiMyNeural', gender: 'Female' };
        const lang = String(info.lang || 'vi-VN');
        const voiceName = String(info.voiceName || '');
        const gender = String(info.gender || 'Female');
        const clean = normalizeText(text);
        return `<speak version='1.0' xml:lang='${lang}'><voice xml:lang='${lang}' xml:gender='${gender}' name='${voiceName}'><prosody rate='0%'>${escapeXml(clean)}</prosody></voice></speak>`;
    }

    function isBingTokenFresh(tokenData) {
        if (!tokenData) {
            return false;
        }
        const exp = Number(tokenData.expiresAt || 0);
        if (!Number.isFinite(exp) || exp <= 0) {
            return false;
        }
        return exp - Date.now() > 15000;
    }

    function clearBingTokenCache() {
        state.bingTokenCache = null;
    }

    function extractBingTokenDataFromHtml(html) {
        const src = String(html || '');
        if (!src.trim()) {
            return null;
        }

        // AbusePreventionHelper: [key, token, ..., expiryInterval]
        let arrStr = '';
        const idx = src.indexOf('params_AbusePreventionHelper');
        if (idx >= 0) {
            const start = src.indexOf('[', idx);
            if (start >= 0) {
                const end = src.indexOf(']', start);
                if (end > start) {
                    arrStr = src.slice(start, end + 1);
                }
            }
        }
        if (!arrStr) {
            const m = /params_AbusePreventionHelper\s*=\s*(\[[\s\S]*?\])/m.exec(src);
            if (m && m[1]) {
                arrStr = m[1];
            }
        }

        const mIG = /IG\s*:\s*["']([A-Za-z0-9]+)["']/.exec(src) || /IG\s*=\s*["']([A-Za-z0-9]+)["']/.exec(src) || /IG:"([A-Za-z0-9]+)"/.exec(src) || /"IG":"([A-Za-z0-9]+)"/.exec(src);
        const mIID = /data-iid\s*=\s*["'](translator\.\d+(?:\.\d+)?)["']/.exec(src) || /"IID":"(translator\.\d+(?:\.\d+)?)"/.exec(src) || /IID\s*:\s*["'](translator\.\d+(?:\.\d+)?)["']/.exec(src);

        let key = '';
        let token = '';
        let tokenExpiryInterval = 0;
        if (arrStr) {
            try {
                const arr = JSON.parse(arrStr);
                key = arr && typeof arr[0] !== 'undefined' ? String(arr[0]) : '';
                token = arr && typeof arr[1] !== 'undefined' ? String(arr[1]) : '';
                tokenExpiryInterval = arr && typeof arr[3] !== 'undefined' ? Number(arr[3]) : 0;
            } catch (err) {
                // ignore
            }
        }

        const IG = mIG && mIG[1] ? String(mIG[1]) : '';
        const IID = mIID && mIID[1] ? String(mIID[1]) : '';
        if (!IG || !IID || !key || !token) {
            return null;
        }
        return { IG, IID, key, token, tokenExpiryInterval };
    }

    function getBingTokenData(timeoutMs) {
        if (isBingTokenFresh(state.bingTokenCache)) {
            return Promise.resolve(state.bingTokenCache);
        }
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: BING_TRANSLATOR_URL,
                timeout: Number(timeoutMs) > 0 ? Number(timeoutMs) : BING_DEFAULT_TIMEOUT_MS,
                anonymous: false,
                withCredentials: true,
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Referer': 'https://www.bing.com/'
                },
                onload: (res) => {
                    try {
                        const status = Number(res && typeof res.status !== 'undefined' ? res.status : 0);
                        const html = String(res && typeof res.responseText !== 'undefined' ? res.responseText : '');
                        if (status < 200 || status >= 300 || !html.trim()) {
                            const err = new Error(`HTTP ${status || 0}`);
                            err.code = 'BING_TOKEN_HTTP';
                            reject(err);
                            return;
                        }

                        const extracted = extractBingTokenDataFromHtml(html);
                        if (!extracted) {
                            const err = new Error('Không đọc được token Bing (thiếu IG/IID/token). Mở https://www.bing.com/translator 1 lần rồi thử lại.');
                            err.code = 'BING_TOKEN_PARSE';
                            reject(err);
                            return;
                        }

                        let expiryMs = Number.isFinite(Number(extracted.tokenExpiryInterval)) ? Number(extracted.tokenExpiryInterval) : 0;
                        // value thường là giây; nếu quá lớn thì coi là ms
                        if (expiryMs > 0 && expiryMs < 60000) {
                            expiryMs = expiryMs * 1000;
                        }
                        if (!expiryMs || expiryMs < 60000) {
                            expiryMs = 45 * 60 * 1000;
                        }
                        const tokenData = {
                            IG: extracted.IG,
                            IID: extracted.IID,
                            key: extracted.key,
                            token: extracted.token,
                            expiresAt: Date.now() + Math.min(expiryMs, 6 * 60 * 60 * 1000)
                        };
                        state.bingTokenCache = tokenData;
                        resolve(tokenData);
                    } catch (err) {
                        const e = new Error('Không đọc được token Bing');
                        e.code = 'BING_TOKEN_PARSE';
                        reject(e);
                    }
                },
                onerror: () => {
                    const err = new Error('request error');
                    err.code = 'BING_TOKEN_NET';
                    reject(err);
                },
                ontimeout: () => {
                    const err = new Error('request timeout');
                    err.code = 'BING_TOKEN_TIMEOUT';
                    reject(err);
                }
            });
        });
    }

    function invokeBingTtsWithGap(url, body, timeoutMs, minGapMs) {
        const gap = Math.max(0, Number(minGapMs) || 0);
        const now = Date.now();
        const lastAt = Number(state.bingLastRequestAt || 0);
        const wait = (gap > 0 && lastAt > 0) ? Math.max(0, gap - (now - lastAt)) : 0;
        return sleep(wait).then(() => {
            state.bingLastRequestAt = Date.now();
            return invokeBingTts(url, body, timeoutMs);
        });
    }

    function invokeBingTts(url, body, timeoutMs) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url,
                data: body,
                timeout: Number(timeoutMs) > 0 ? Number(timeoutMs) : BING_DEFAULT_TIMEOUT_MS,
                responseType: 'arraybuffer',
                anonymous: false,
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': '*/*',
                    'Origin': 'https://www.bing.com',
                    'Referer': BING_TRANSLATOR_URL
                },
                onload: (res) => {
                    const status = Number(res && typeof res.status !== 'undefined' ? res.status : 0);
                    if (status < 200 || status >= 300) {
                        const err = new Error(`HTTP ${status || 0}`);
                        err.code = status === 429 ? 'BING_429' : (status === 403 ? 'BING_403' : 'BING_HTTP');
                        reject(err);
                        return;
                    }
                    const base64 = arrayBufferToBase64(res.response);
                    if (!base64) {
                        const err = new Error('no audio');
                        err.code = 'BING_NO_AUDIO';
                        reject(err);
                        return;
                    }
                    resolve(base64);
                },
                onerror: () => {
                    const err = new Error('request error');
                    err.code = 'BING_NET';
                    reject(err);
                },
                ontimeout: () => {
                    const err = new Error('request timeout');
                    err.code = 'BING_TIMEOUT';
                    reject(err);
                }
            });
        });
    }

    function bingSynthesizeBase64(text, voiceId, options) {
        if (typeof GM_xmlhttpRequest !== 'function') {
            return Promise.reject(new Error('Trình duyệt không hỗ trợ GM_xmlhttpRequest'));
        }
        const cleanText = normalizeText(text);
        if (!cleanText) {
            return Promise.reject(new Error('Text rỗng'));
        }
        const voiceInfo = parseBingVoice(voiceId || state.settings.bingVoiceId) || parseBingVoice('vi-VN-HoaiMyNeural;Female');
        const ssml = buildBingSsml(cleanText, voiceInfo);

        const opts = options || {};
        const timeoutMs = Number(opts.timeout) > 0 ? Number(opts.timeout) : BING_DEFAULT_TIMEOUT_MS;
        const retries = clampInt(opts.retries, 0, 4);
        const minGapMs = clampInt(opts.minGapMs, 0, 2000) || BING_MIN_REQUEST_GAP_MS;

        const attemptCount = Math.max(1, Number(retries) + 1);
        let attempt = 0;
        let lastErr = null;

        const run = () => {
            attempt += 1;
            return getBingTokenData(timeoutMs)
                .then((tokenData) => {
                    const url = `${BING_TTS_ENDPOINT}?isVertical=1&IG=${encodeURIComponent(tokenData.IG)}&IID=${encodeURIComponent(tokenData.IID)}`;
                    const body = new URLSearchParams({
                        ssml,
                        token: tokenData.token,
                        key: String(tokenData.key)
                    }).toString();
                    return invokeBingTtsWithGap(url, body, timeoutMs, minGapMs);
                })
                .catch((err) => {
                    lastErr = err;
                    const code = err && err.code ? String(err.code) : '';
                    if (code.startsWith('BING_TOKEN') || code === 'BING_429' || code === 'BING_403') {
                        clearBingTokenCache();
                    }
                    if (attempt >= attemptCount) {
                        return Promise.reject(lastErr);
                    }
                    const jitter = Math.floor(Math.random() * 180);
                    const backoff = (520 * attempt) + jitter;
                    return sleep(backoff).then(run);
                });
        };

        return run();
    }

    function finalizeSegment(segment) {
        if (!segment || !segment.paragraphEl) {
            return;
        }

        if (segment.chunkIndex >= segment.chunkTotal - 1) {
            segment.paragraphEl.classList.add('twd-tts-read');
        }
        segment.paragraphEl.classList.remove('twd-tts-active');
    }

    function markParagraphsBeforeSegmentAsRead(segmentIdx) {
        const segment = state.segments[segmentIdx];
        if (!segment || segment.isTitle) {
            return;
        }

        state.paragraphs.forEach((p, idx) => {
            if (idx < segment.paragraphIndex) {
                p.classList.add('twd-tts-read');
            }
        });
    }

    function activateSegmentHighlight(segment) {
        clearActiveHighlight();
        if (!segment || !segment.paragraphEl) {
            return;
        }
        segment.paragraphEl.classList.add('twd-tts-active');
        if (state.settings.autoScroll) {
            segment.paragraphEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function clearActiveHighlight() {
        state.paragraphs.forEach((p) => p.classList.remove('twd-tts-active'));
    }

    function resetHighlights() {
        state.paragraphs.forEach((p) => {
            p.classList.remove('twd-tts-active');
            p.classList.remove('twd-tts-read');
        });
    }

    function stopSpeechOnly(keepMediaSession) {
        state.utteranceToken += 1;
        speechSynthesis.cancel();
        state.prefetchJobId += 1;
        clearNextSegmentTimer();
        if (state.currentAudio) {
            state.currentAudio.pause();
            state.currentAudio.onended = null;
            state.currentAudio.onerror = null;
        }
        if (!keepMediaSession) {
            setMediaSessionPlaybackStateSafe('none');
            stopSilentAudioKeepAlive();
        }
    }

    function getSharedAudio() {
        if (state.sharedAudio) {
            return state.sharedAudio;
        }
        const audio = new Audio();
        audio.preload = 'auto';
        state.sharedAudio = audio;
        return audio;
    }

    function generateSilentWavDataUri() {
        // Tạo 1 giây WAV im lặng: mono, 8kHz, 8-bit PCM
        const sampleRate = 8000;
        const numSamples = sampleRate; // 1 giây
        const headerSize = 44;
        const dataSize = numSamples;
        const buffer = new ArrayBuffer(headerSize + dataSize);
        const view = new DataView(buffer);
        // RIFF header
        view.setUint32(0, 0x52494646, false);   // 'RIFF'
        view.setUint32(4, 36 + dataSize, true);  // file size - 8
        view.setUint32(8, 0x57415645, false);   // 'WAVE'
        // fmt sub-chunk
        view.setUint32(12, 0x666D7420, false);  // 'fmt '
        view.setUint32(16, 16, true);            // sub-chunk size
        view.setUint16(20, 1, true);             // PCM
        view.setUint16(22, 1, true);             // mono
        view.setUint32(24, sampleRate, true);    // sample rate
        view.setUint32(28, sampleRate, true);    // byte rate
        view.setUint16(32, 1, true);             // block align
        view.setUint16(34, 8, true);             // bits per sample
        // data sub-chunk
        view.setUint32(36, 0x64617461, false);  // 'data'
        view.setUint32(40, dataSize, true);
        // Im lặng: 8-bit PCM silence = 128
        const bytes = new Uint8Array(buffer);
        for (let i = headerSize; i < headerSize + dataSize; i++) {
            bytes[i] = 128;
        }
        // Chuyển sang base64 data URI
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return 'data:audio/wav;base64,' + btoa(binary);
    }

    function getSilentAudio() {
        if (state.silentAudio) {
            return state.silentAudio;
        }
        const audio = new Audio();
        audio.src = generateSilentWavDataUri();
        audio.loop = true;
        audio.volume = 0;
        state.silentAudio = audio;
        return audio;
    }

    function startSilentAudioKeepAlive() {
        const sa = getSilentAudio();
        if (sa.paused) {
            sa.play().catch(() => { });
        }
    }

    function stopSilentAudioKeepAlive() {
        if (state.silentAudio && !state.silentAudio.paused) {
            state.silentAudio.pause();
        }
    }

    function updateMediaSession(providerLabel, segment) {
        if (!('mediaSession' in navigator) || !navigator.mediaSession) {
            return;
        }
        try {
            const title = normalizeText(state.title) || 'Truyện';
            const segText = segment && segment.text ? normalizeText(segment.text) : '';
            const artist = providerLabel ? `TTS: ${providerLabel}` : 'TTS';
            navigator.mediaSession.metadata = new MediaMetadata({
                title,
                artist,
                album: segText ? segText.slice(0, 64) : ''
            });
        } catch (err) {

        }

        if (state.mediaSessionBound) {
            return;
        }
        state.mediaSessionBound = true;
        try {
            // Luôn đi qua các handler của script để state.paused/state.reading đồng bộ.
            navigator.mediaSession.setActionHandler('play', () => {
                if (state.paused || !state.reading) {
                    onPlayClick();
                }
            });
            navigator.mediaSession.setActionHandler('pause', () => {
                if (state.reading && !state.paused) {
                    onPauseClick();
                }
            });
            navigator.mediaSession.setActionHandler('stop', () => {
                stopReading(true);
            });
            navigator.mediaSession.setActionHandler('nexttrack', () => onNextClick());
            navigator.mediaSession.setActionHandler('previoustrack', () => {
                if (state.segments.length === 0) return;
                const prev = Math.max(0, state.segmentIndex - 1);
                stopSpeechOnly();
                state.segmentIndex = prev;
                speakCurrentSegment();
            });
        } catch (err) {

        }
    }

    function setMediaSessionPlaybackStateSafe(stateValue) {
        if (!('mediaSession' in navigator) || !navigator.mediaSession) {
            return;
        }
        try {

            navigator.mediaSession.playbackState = stateValue;
        } catch (err) {

        }
    }

    function stopReading(showStatus) {
        state.reading = false;
        state.paused = false;
        stopSpeechOnly();
        stopSilentAudioKeepAlive();
        clearActiveHighlight();
        updateProgressText();
        if (showStatus) {
            updateStatus('Đã dừng');
        }
    }

    function finishChapter() {
        state.reading = false;
        state.paused = false;
        clearActiveHighlight();
        updateProgressText(true);

        if (advanceToNextPartOrChapter()) {
            return;
        }

        if (state.settings.autoNext && state.nextUrl) {
            updateStatus('Xong chương, chuyển chương sau...');
            if (state.settings.autoStartOnNextChapter) {
                saveSessionForNextChapter();
            }
            setTimeout(() => {
                window.location.href = state.nextUrl;
            }, 600);
            return;
        }

        stopSilentAudioKeepAlive();
        updateStatus('Đọc xong chương');
        if (!state.nextUrl && !getNextChapterPartLink()) {
            setTimeout(() => speakEndOfContentNotice(), 250);
        }
    }

    function refreshStartRange() {
        const max = Math.max(1, state.paragraphs.length);
        state.ui.startInput.min = '1';
        state.ui.startInput.max = String(max);
        const current = clampInt(state.ui.startInput.value, 1, max);
        setStartParagraphInput(current);
    }

    function updateProgressText(forceDone) {
        const total = state.segments.length;
        if (total === 0) {
            state.ui.status.textContent = 'Không có đoạn để đọc';
            return;
        }

        if (forceDone) {
            state.ui.status.textContent = `Đọc xong ${total}/${total} mục`;
            return;
        }

        const current = Math.min(state.segmentIndex + 1, total);
        const currentSeg = state.segments[Math.min(state.segmentIndex, total - 1)];
        if (!currentSeg) {
            state.ui.status.textContent = `Sẵn sàng (${total} mục)`;
            return;
        }

        if (currentSeg.isTitle) {
            state.ui.status.textContent = `Mục ${current}/${total}: Tiêu đề`;
            return;
        }

        state.ui.status.textContent = `Mục ${current}/${total}: Đoạn ${currentSeg.paragraphIndex + 1}/${Math.max(1, state.paragraphs.length)}`;
    }

    function updateStatus(text) {
        updateProgressText();
        if (!text) {
            return;
        }
        state.ui.status.textContent = `${state.ui.status.textContent} | ${text}`;
    }

    function initVoiceList() {
        renderVoiceOptions();
        refreshProviderUi();
        updateTikTokCookieInfo();
        speechSynthesis.addEventListener('voiceschanged', () => {
            if (getProviderId() === 'browser') {
                renderVoiceOptions();
            }
        });
    }

    function renderVoiceOptions() {
        const ui = state.ui;
        ui.voiceSelect.innerHTML = '';

        if (isRemoteProvider()) {
            const provider = getActiveRemoteProvider();
            if (!provider) {
                const opt = document.createElement('option');
                opt.value = '';
                opt.textContent = 'Provider chưa hỗ trợ';
                ui.voiceSelect.appendChild(opt);
                return;
            }

            const voices = provider.voices.slice().sort((a, b) => {
                if (a.language === b.language) {
                    return a.name.localeCompare(b.name);
                }
                const isVi = (lang) => /^vi(?:$|-)/i.test(String(lang || ''));
                if (isVi(a.language)) {
                    return -1;
                }
                if (isVi(b.language)) {
                    return 1;
                }
                return a.language.localeCompare(b.language);
            });

            voices.forEach((voice) => {
                const opt = document.createElement('option');
                opt.value = voice.id;
                opt.textContent = `${voice.name} (${voice.language})`;
                ui.voiceSelect.appendChild(opt);
            });

            const currentVoiceId = provider.getVoiceId();
            if (!currentVoiceId || !voices.some((v) => v.id === currentVoiceId)) {
                provider.setVoiceId(provider.defaultVoiceId || (voices[0] ? voices[0].id : ''));
                saveSettings();
            }
            ui.voiceSelect.value = provider.getVoiceId();
            return;
        }

        const voices = speechSynthesis.getVoices() || [];
        if (voices.length === 0) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = 'Không thấy voice browser (thử reload)';
            ui.voiceSelect.appendChild(opt);
            return;
        }

        voices
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach((voice) => {
                const opt = document.createElement('option');
                opt.value = voice.voiceURI;
                opt.textContent = `${voice.name} (${voice.lang})`;
                ui.voiceSelect.appendChild(opt);
            });

        if (!state.settings.voiceURI) {
            const vi = voices.find((v) => /vi/i.test(v.lang));
            state.settings.voiceURI = vi ? vi.voiceURI : voices[0].voiceURI;
            saveSettings();
        }

        ui.voiceSelect.value = state.settings.voiceURI;
        if (ui.voiceSelect.value !== state.settings.voiceURI && voices[0]) {
            state.settings.voiceURI = voices[0].voiceURI;
            ui.voiceSelect.value = voices[0].voiceURI;
            saveSettings();
        }
    }

    function refreshProviderUi() {
        const ui = state.ui;
        if (!ui) {
            return;
        }
        const providerId = getProviderId();
        const isTikTok = providerId === 'tiktok';
        const isBrowser = providerId === 'browser';
        ui.providerSelect.value = providerId;


        ui.tiktokAuthRow.classList.toggle('twd-tts-hidden', !isTikTok);

        if (isTikTok) {
            const cap = state.gmCookieCapability;

            if (cap === 'full') {

                ui.tiktokAuthMsg.textContent = 'Cookie tự động (Tampermonkey Beta). Không cần nhập cookie.';
                ui.tiktokLoginBtn.classList.add('twd-tts-hidden');
                if (ui.tiktokCookieRow) {
                    ui.tiktokCookieRow.classList.add('twd-tts-hidden');
                }
            } else if (cap === 'no_session') {

                ui.tiktokAuthMsg.textContent = 'Chưa đăng nhập TikTok trên trình duyệt. Bấm "Mở TikTok" để đăng nhập, rồi reload trang truyện.';
                ui.tiktokLoginBtn.classList.remove('twd-tts-hidden');
                if (ui.tiktokCookieRow) {
                    ui.tiktokCookieRow.classList.add('twd-tts-hidden');
                }
            } else {

                ui.tiktokAuthMsg.textContent = 'Nếu bạn dùng Tampermonkey Beta: đăng nhập TikTok rồi reload để tự lấy cookie. Tampermonkey Stable/Violentmonkey thường không đọc được cookie HttpOnly, hãy dùng "Nhập cookie".';
                ui.tiktokLoginBtn.classList.remove('twd-tts-hidden');
                if (ui.tiktokCookieRow) {
                    ui.tiktokCookieRow.classList.remove('twd-tts-hidden');
                }
                updateTikTokCookieInfo();
            }
        } else {

            if (ui.tiktokCookieRow) {
                ui.tiktokCookieRow.classList.add('twd-tts-hidden');
            }
        }

        if (ui.prefetchInput) {
            ui.prefetchInput.checked = !!state.settings.prefetchEnabled;
        }
        if (ui.prefetchCountInput) {
            ui.prefetchCountInput.value = String(clampInt(state.settings.prefetchCount, 0, 6));
        }
        ui.pitchInput.disabled = !isBrowser;
        ui.pitchInput.title = !isBrowser ? 'Giọng remote không hỗ trợ pitch' : '';
    }

    function bindUnloadCancel() {
        window.addEventListener('beforeunload', () => {
            speechSynthesis.cancel();
            if (state.currentAudio) {
                state.currentAudio.pause();
            }
        });
    }

    function injectStyles() {
        const css = `
            #bookContentBody p.twd-tts-active,
            #bookContentBody.twd-tts-active {
                background: #fff4bf;
                transition: background-color 0.2s ease;
                border-radius: 4px;
            }

            #bookContentBody p.twd-tts-read,
            #bookContentBody.twd-tts-read {
                background: #d9fbe7;
                transition: background-color 0.2s ease;
                border-radius: 4px;
            }

            #bookContentBody.twd-tts-pick-mode .twd-tts-pick-target,
            #bookContentBody.twd-tts-pick-mode.twd-tts-pick-target {
                position: relative;
                padding-left: 36px;
            }

            #bookContentBody.twd-tts-pick-mode .twd-tts-pick-point {
                position: absolute;
                left: 8px;
                top: 6px;
                width: 22px;
                height: 22px;
                border: none;
                border-radius: 999px;
                background: linear-gradient(135deg, #26c6da 0%, #42a5f5 100%);
                box-shadow: 0 6px 14px rgba(30, 64, 175, 0.3);
                cursor: pointer;
                display: grid;
                place-items: center;
                padding: 0;
                z-index: 2;
            }

            #bookContentBody.twd-tts-pick-mode .twd-tts-pick-point svg {
                width: 12px;
                height: 12px;
                stroke: #fff;
                stroke-width: 2.2;
                fill: none;
                stroke-linecap: round;
                stroke-linejoin: round;
            }

            #bookContentBody.twd-tts-pick-mode .twd-tts-pick-point:hover {
                filter: brightness(1.08);
                transform: translateY(-1px);
            }
        `;

        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }
})();
